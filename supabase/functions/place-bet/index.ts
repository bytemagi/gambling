import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── SLOT GAME CONFIGURATIONS ───────────────────────────────────
const SLOT_GAME_CONFIGS: Record<string, { symbols: string[]; payouts: Record<string, number> }> = {
  classic: {
    symbols: ['🍒','🍋','🍊','⭐','💎','7️⃣'],
    payouts: { '💎': 20, '7️⃣': 10, '⭐': 5, '🍒': 5 }
  },
  fruit: {
    symbols: ['🍒','🍋','🍊','🍉','🍇','🍌'],
    payouts: { '🍇': 15, '🍉': 10, '🍊': 8, '🍋': 6, '🍌': 5, '🍒': 5 }
  },
  diamond: {
    symbols: ['💎','⭐','🌟','✨','💫','🔥'],
    payouts: { '💎': 25, '🔥': 15, '💫': 10, '✨': 8, '🌟': 6, '⭐': 5 }
  },
  wild: {
    symbols: ['🤠','⭐','🦬','🌵','💰','🔫'],
    payouts: { '🤠': 20, '💰': 15, '🦬': 10, '⭐': 8, '🌵': 6, '🔫': 5 }
  }
};

// ── Provably fair RNG ─────────────────────────────────────────

async function hmac(serverSeed: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(serverSeed), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function hashSeed(seed: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function deriveOutcome(game: string, hex: string, amount: number, choice?: any) {
  const v0 = parseInt(hex.slice(0, 8), 16);
  if (game === 'coin') {
    const outcome = v0 % 2 === 0 ? 'heads' : 'tails';
    return { outcome, win: false, delta: 0 };
  }
  if (game === 'dice') {
    const outcome = (v0 % 6) + 1;
    return { outcome, win: false, delta: 0 };
  }
  if (game === 'slots') {
    // Get slot game type from choice parameter (default to 'classic')
    const slotType = (choice as any)?.gameType || 'classic';
    const config = SLOT_GAME_CONFIGS[slotType] || SLOT_GAME_CONFIGS['classic'];
    const symbols = config.symbols;
    const symbolCount = symbols.length;
    
    const reels = [
      symbols[parseInt(hex.slice(0,  8), 16) % symbolCount],
      symbols[parseInt(hex.slice(8, 16), 16) % symbolCount],
      symbols[parseInt(hex.slice(16,24), 16) % symbolCount],
    ];
    
    let delta: number;
    if (reels[0]===reels[1] && reels[1]===reels[2]) {
      // Three of a kind - use game-specific payouts
      const symbol = reels[0];
      const payout = config.payouts[symbol] || 5;
      delta = amount * payout;
    } else if (reels[0]===reels[1] || reels[1]===reels[2] || reels[0]===reels[2])
      delta = 0;
    else
      delta = -amount;
    return { outcome: reels, win: delta > 0, delta };
  }
  if (game === 'crash') {
    const v = parseInt(hex.slice(0, 8), 16);
    const crashPoint = Math.max(1.00, parseFloat(((100 / (1 - (v / 0xFFFFFFFF) * 0.99))).toFixed(2)));
    return { outcome: crashPoint, win: false, delta: 0 };
  }
  if (game === 'mines') {
    const totalCells = 25;
    const positions: number[] = [];
    for (let i = 0; i < totalCells; i++) {
      const chunk = parseInt(hex.slice(i*2, i*2+2), 16);
      positions.push(chunk % totalCells);
    }
    return { outcome: [...new Set(positions)], win: false, delta: 0 };
  }
  throw new Error(`Unknown game: ${game}`);
}

function applyChoice(game: string, derived: ReturnType<typeof deriveOutcome>, choice: unknown, amount: number) {
  if (game === 'coin') {
    const win = derived.outcome === choice;
    return { ...derived, win, delta: win ? amount : -amount };
  }
  if (game === 'dice') {
    const win = derived.outcome === choice;
    return { ...derived, win, delta: win ? amount * 5 : -amount };
  }
  if (game === 'crash') {
    const cashoutAt = typeof choice === 'number' ? choice : parseFloat(choice as string);
    const crashPoint = derived.outcome as number;
    const safeCashoutAt = Number.isFinite(cashoutAt) && cashoutAt >= 1 ? cashoutAt : 1;
    const win = safeCashoutAt <= crashPoint;
    const delta = win ? Math.floor(amount * safeCashoutAt) - amount : -amount;
    return { ...derived, outcome: crashPoint, win, delta, cashoutAt: safeCashoutAt };
  }
  return derived;
}

function minesMultiplier(mineCount: number, safeRevealed: number): number {
  if (safeRevealed <= 0) return 0;
  return parseFloat((Math.pow(25 / (25 - mineCount), safeRevealed) * 0.97).toFixed(2));
}

function makeServerSeed(): string {
  return crypto.randomUUID().replace(/-/g,'') + crypto.randomUUID().replace(/-/g,'');
}

function commonHeaders() {
  return { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: commonHeaders() });

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { game, amount, choice, clientSeed, nonce } = await req.json();

  if (!['coin','dice','slots','crash','mines'].includes(game))
    return new Response(JSON.stringify({ error: 'Invalid game' }), { status: 400, headers: commonHeaders() });
  if (!Number.isInteger(amount) || amount <= 0 || amount > 100000)
    return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400, headers: commonHeaders() });
  if (!clientSeed || typeof clientSeed !== 'string' || clientSeed.length > 128)
    return new Response(JSON.stringify({ error: 'Invalid client seed' }), { status: 400, headers: commonHeaders() });
  if (!Number.isInteger(nonce) || nonce < 0)
    return new Response(JSON.stringify({ error: 'Invalid nonce' }), { status: 400, headers: commonHeaders() });

  const { data: profile } = await db.from('profiles').select('username').single();
  const { data: { user } } = await db.auth.getUser();
  if (!user?.id) return new Response(JSON.stringify({ error: 'Unauthorized user' }), { status: 401, headers: commonHeaders() });

  if (game === 'mines') {
    const minesChoice = choice as { action?: string; mineCount?: number; roundId?: number; cell?: number };

    if (minesChoice?.action === 'start') {
      const mineCount = Number(minesChoice.mineCount);
      if (!Number.isInteger(mineCount) || mineCount < 1 || mineCount > 24) {
        return new Response(JSON.stringify({ error: 'Invalid mine count' }), { status: 400, headers: commonHeaders() });
      }

      const serverSeedRaw = makeServerSeed();
      const serverSeedHash = await hashSeed(serverSeedRaw);
      const hex = await hmac(serverSeedRaw, `${clientSeed}:${nonce}`);
      const derived = deriveOutcome('mines', hex, amount);
      const mines = (derived.outcome as number[]).slice(0, mineCount);

      const { data: newBal, error: rpcErr } = await db.rpc('deduct_balance', { p_amount: amount });
      if (rpcErr) return new Response(JSON.stringify({ error: rpcErr.message }), { status: 400, headers: commonHeaders() });

      const { data: insertedRound, error: roundErr } = await db.from('mines_rounds').insert({
        user_id: user.id,
        username: profile?.username ?? 'unknown',
        bet_amount: amount,
        mine_count: mineCount,
        mines,
        revealed: [],
        status: 'active',
        server_seed: serverSeedRaw,
        server_seed_hash: serverSeedHash,
        client_seed: clientSeed,
        nonce,
      }).select('id').single();

      if (roundErr || !insertedRound?.id) {
        await db.rpc('credit_balance', { p_amount: amount });
        return new Response(JSON.stringify({ error: roundErr?.message ?? 'Failed to create round' }), { status: 500, headers: commonHeaders() });
      }

      return new Response(JSON.stringify({
        ok: true,
        action: 'start',
        roundId: insertedRound.id,
        balance: newBal,
        serverSeedHash,
        clientSeed,
        nonce,
      }), { headers: commonHeaders() });
    }

    if (minesChoice?.action === 'reveal') {
      const roundId = Number(minesChoice.roundId);
      const cell = Number(minesChoice.cell);
      if (!Number.isInteger(roundId) || roundId <= 0) return new Response(JSON.stringify({ error: 'Invalid roundId' }), { status: 400, headers: commonHeaders() });
      if (!Number.isInteger(cell) || cell < 0 || cell > 24) return new Response(JSON.stringify({ error: 'Invalid cell' }), { status: 400, headers: commonHeaders() });

      const { data: round, error: roundErr } = await db.from('mines_rounds').select('*').eq('id', roundId).single();
      if (roundErr || !round) return new Response(JSON.stringify({ error: 'Round not found' }), { status: 404, headers: commonHeaders() });
      if (round.user_id !== user.id) return new Response(JSON.stringify({ error: 'Forbidden round access' }), { status: 403, headers: commonHeaders() });
      if (round.status !== 'active') return new Response(JSON.stringify({ error: 'Round already settled' }), { status: 400, headers: commonHeaders() });

      const mines: number[] = Array.isArray(round.mines) ? round.mines : [];
      const revealed: number[] = Array.isArray(round.revealed) ? round.revealed : [];
      if (revealed.includes(cell)) return new Response(JSON.stringify({ error: 'Cell already revealed' }), { status: 400, headers: commonHeaders() });

      const hitMine = mines.includes(cell);

      if (hitMine) {
        const { error: updateErr } = await db.from('mines_rounds')
          .update({ status: 'lost', updated_at: new Date().toISOString() })
          .eq('id', roundId);
        if (updateErr) return new Response(JSON.stringify({ error: updateErr.message }), { status: 500, headers: commonHeaders() });

        const { data: profileNow } = await db.from('profiles').select('balance').single();
        const finalBal = Number(profileNow?.balance ?? 0);

        await db.from('bets').insert({
          user_id: user.id,
          username: round.username,
          game: 'mines',
          amount: round.bet_amount,
          outcome: { result: mines, win: false, delta: -round.bet_amount },
          balance_after: finalBal,
          server_seed: round.server_seed,
          server_seed_hash: round.server_seed_hash,
          client_seed: round.client_seed,
          nonce: round.nonce,
        });

        return new Response(JSON.stringify({
          ok: true,
          action: 'reveal',
          hitMine: true,
          cell,
          mines,
          revealed,
          win: false,
          delta: -round.bet_amount,
          balance: finalBal,
          serverSeed: round.server_seed,
          serverSeedHash: round.server_seed_hash,
          clientSeed: round.client_seed,
          nonce: round.nonce,
        }), { headers: commonHeaders() });
      }

      const newRevealed = [...revealed, cell];
      const { error: updateErr } = await db.from('mines_rounds')
        .update({ revealed: newRevealed, updated_at: new Date().toISOString() })
        .eq('id', roundId);
      if (updateErr) return new Response(JSON.stringify({ error: updateErr.message }), { status: 500, headers: commonHeaders() });

      const mult = minesMultiplier(round.mine_count, newRevealed.length);
      const projectedPayout = Math.floor(round.bet_amount * mult);

      const { data: profileNow } = await db.from('profiles').select('balance').single();
      const balNow = Number(profileNow?.balance ?? 0);

      return new Response(JSON.stringify({
        ok: true,
        action: 'reveal',
        hitMine: false,
        cell,
        minesCount: round.mine_count,
        revealed: newRevealed,
        multiplier: mult,
        projectedPayout,
        balance: balNow,
        serverSeedHash: round.server_seed_hash,
        clientSeed: round.client_seed,
        nonce: round.nonce,
      }), { headers: commonHeaders() });
    }

    if (minesChoice?.action === 'cashout') {
      const roundId = Number(minesChoice.roundId);
      if (!Number.isInteger(roundId) || roundId <= 0) return new Response(JSON.stringify({ error: 'Invalid roundId' }), { status: 400, headers: commonHeaders() });

      const { data: round, error: roundErr } = await db.from('mines_rounds').select('*').eq('id', roundId).single();
      if (roundErr || !round) return new Response(JSON.stringify({ error: 'Round not found' }), { status: 404, headers: commonHeaders() });
      if (round.user_id !== user.id) return new Response(JSON.stringify({ error: 'Forbidden round access' }), { status: 403, headers: commonHeaders() });
      if (round.status !== 'active') return new Response(JSON.stringify({ error: 'Round already settled' }), { status: 400, headers: commonHeaders() });

      const revealed: number[] = Array.isArray(round.revealed) ? round.revealed : [];
      if (revealed.length === 0) return new Response(JSON.stringify({ error: 'Reveal at least one safe cell before cashout' }), { status: 400, headers: commonHeaders() });

      const mult = minesMultiplier(round.mine_count, revealed.length);
      const totalPayout = Math.floor(round.bet_amount * mult);
      const delta = totalPayout - round.bet_amount;
      if (totalPayout > 0) await db.rpc('credit_balance', { p_amount: totalPayout });

      const { error: updateErr } = await db.from('mines_rounds')
        .update({ status: 'cashed_out', updated_at: new Date().toISOString() })
        .eq('id', roundId);
      if (updateErr) return new Response(JSON.stringify({ error: updateErr.message }), { status: 500, headers: commonHeaders() });

      const { data: profileNow } = await db.from('profiles').select('balance').single();
      const finalBal = Number(profileNow?.balance ?? 0);

      await db.from('bets').insert({
        user_id: user.id,
        username: round.username,
        game: 'mines',
        amount: round.bet_amount,
        outcome: { result: round.mines, win: delta > 0, delta },
        balance_after: finalBal,
        server_seed: round.server_seed,
        server_seed_hash: round.server_seed_hash,
        client_seed: round.client_seed,
        nonce: round.nonce,
      });

      return new Response(JSON.stringify({
        ok: true,
        action: 'cashout',
        win: delta > 0,
        delta,
        multiplier: mult,
        outcome: round.mines,
        balance: finalBal,
        serverSeed: round.server_seed,
        serverSeedHash: round.server_seed_hash,
        clientSeed: round.client_seed,
        nonce: round.nonce,
      }), { headers: commonHeaders() });
    }

    return new Response(JSON.stringify({ error: 'Invalid mines action' }), { status: 400, headers: commonHeaders() });
  }

  const serverSeedRaw  = makeServerSeed();
  const serverSeedHash = await hashSeed(serverSeedRaw);
  const hex            = await hmac(serverSeedRaw, `${clientSeed}:${nonce}`);
  const derived        = deriveOutcome(game, hex, amount, choice);
  const result         = applyChoice(game, derived, choice, amount);

  const { data: newBal, error: rpcErr } = await db.rpc('deduct_balance', { p_amount: amount });
  if (rpcErr) return new Response(JSON.stringify({ error: rpcErr.message }), { status: 400, headers: commonHeaders() });

  const payout   = result.delta + amount;
  const finalBal = (newBal as number) + payout;
  if (payout > 0) await db.rpc('credit_balance', { p_amount: payout });

  await db.from('bets').insert({
    user_id:          user.id,
    username:         profile?.username ?? 'unknown',
    game,
    amount,
    outcome:          { result: result.outcome, win: result.win, delta: result.delta },
    balance_after:    finalBal,
    server_seed:      serverSeedRaw,
    server_seed_hash: serverSeedHash,
    client_seed:      clientSeed,
    nonce,
  });

  return new Response(JSON.stringify({
    ok: true,
    ...result,
    balance: finalBal,
    serverSeed: serverSeedRaw,
    serverSeedHash,
    clientSeed,
    nonce,
  }), { headers: commonHeaders() });
});
