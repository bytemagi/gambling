import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SYMBOLS = ['🍒','🍋','🍊','⭐','💎','7️⃣'];

// ── Provably fair RNG ─────────────────────────────────────────
// outcome = HMAC-SHA256(serverSeed, clientSeed:nonce)
// Must match deriveOutcome() in provably-fair.js exactly

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

function deriveOutcome(game: string, hex: string, amount: number) {
  const v0 = parseInt(hex.slice(0, 8), 16);
  if (game === 'coin') {
    const outcome = v0 % 2 === 0 ? 'heads' : 'tails';
    return { outcome, win: false, delta: 0 }; // win set by caller with choice
  }
  if (game === 'dice') {
    const outcome = (v0 % 6) + 1;
    return { outcome, win: false, delta: 0 };
  }
  if (game === 'slots') {
    const reels = [
      SYMBOLS[parseInt(hex.slice(0,  8), 16) % 6],
      SYMBOLS[parseInt(hex.slice(8, 16), 16) % 6],
      SYMBOLS[parseInt(hex.slice(16,24), 16) % 6],
    ];
    let delta: number;
    if (reels[0]===reels[1] && reels[1]===reels[2])
      delta = reels[0]==='💎' ? amount*20 : reels[0]==='7️⃣' ? amount*10 : amount*5;
    else if (reels[0]===reels[1] || reels[1]===reels[2] || reels[0]===reels[2])
      delta = 0;
    else
      delta = -amount;
    return { outcome: reels, win: delta > 0, delta };
  }
  if (game === 'crash') {
    // Crash point derived from first 8 hex chars, scaled to 1.00–100.00×
    // Same formula must be mirrored in provably-fair.js deriveOutcome()
    const v = parseInt(hex.slice(0, 8), 16);
    const crashPoint = Math.max(1.00, parseFloat(((100 / (1 - (v / 0xFFFFFFFF) * 0.99))).toFixed(2)));
    return { outcome: crashPoint, win: false, delta: 0 }; // win/delta set by applyChoice
  }
  if (game === 'mines') {
    // Derive 25 mine positions from successive 2-byte chunks of the HMAC
    // choice = { mines: number, revealed: number[] } — cells player revealed before cashing out
    const totalCells = 25;
    const positions: number[] = [];
    for (let i = 0; i < totalCells; i++) {
      const chunk = parseInt(hex.slice(i*2, i*2+2), 16);
      positions.push(chunk % totalCells);
    }
    // Deduplicate to get unique mine positions
    const mineSet = [...new Set(positions)];
    return { outcome: mineSet, win: false, delta: 0 };
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
    // choice = cashoutAt multiplier (e.g. 2.5)
    const cashoutAt  = typeof choice === 'number' ? choice : parseFloat(choice as string);
    const crashPoint = derived.outcome as number;
    const win        = cashoutAt <= crashPoint;
    const delta      = win ? Math.floor(amount * cashoutAt) - amount : -amount;
    return { ...derived, outcome: crashPoint, win, delta, cashoutAt };
  }
  if (game === 'mines') {
    const { mineCount, revealed } = choice as { mineCount: number; revealed: number[] };
    const mines = (derived.outcome as number[]).slice(0, mineCount);
    const hitMine = revealed.some((cell: number) => mines.includes(cell));
    if (hitMine) return { ...derived, outcome: mines, win: false, delta: -amount };
    const multiplier = revealed.length > 0
      ? parseFloat((Math.pow(25 / (25 - mineCount), revealed.length) * 0.97).toFixed(2))
      : 0;
    const delta = revealed.length > 0 ? Math.floor(amount * multiplier) - amount : -amount;
    return { ...derived, outcome: mines, win: delta > 0, delta, multiplier };
  }
  return derived;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { game, amount, choice, clientSeed, nonce } = await req.json();

  if (!['coin','dice','slots','crash','mines'].includes(game))
    return new Response(JSON.stringify({ error: 'Invalid game' }), { status: 400 });
  if (!Number.isInteger(amount) || amount <= 0 || amount > 100000)
    return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400 });
  if (!clientSeed || typeof clientSeed !== 'string' || clientSeed.length > 128)
    return new Response(JSON.stringify({ error: 'Invalid client seed' }), { status: 400 });
  if (!Number.isInteger(nonce) || nonce < 0)
    return new Response(JSON.stringify({ error: 'Invalid nonce' }), { status: 400 });

  // Generate server seed for this bet
  const serverSeedRaw  = crypto.randomUUID().replace(/-/g,'') + crypto.randomUUID().replace(/-/g,'');
  const serverSeedHash = await hashSeed(serverSeedRaw);

  // Derive outcome from HMAC
  const hex     = await hmac(serverSeedRaw, `${clientSeed}:${nonce}`);
  const derived = deriveOutcome(game, hex, amount);
  const result  = applyChoice(game, derived, choice, amount);

  // Atomic balance deduction
  const { data: newBal, error: rpcErr } = await db.rpc('deduct_balance', { p_amount: amount });
  if (rpcErr) return new Response(JSON.stringify({ error: rpcErr.message }), { status: 400 });

  const payout   = result.delta + amount; // net payout (0 = push, >0 = win, amount already deducted)
  const finalBal = (newBal as number) + payout;
  if (payout > 0) await db.rpc('credit_balance', { p_amount: payout });

  const { data: profile } = await db.from('profiles').select('username').single();
  const { data: { user } } = await db.auth.getUser();

  await db.from('bets').insert({
    user_id:         user?.id,
    username:        profile?.username ?? 'unknown',
    game,
    amount,
    outcome:         { result: result.outcome, win: result.win, delta: result.delta },
    balance_after:   finalBal,
    server_seed:     serverSeedRaw,   // revealed immediately (player can verify)
    server_seed_hash: serverSeedHash,
    client_seed:     clientSeed,
    nonce,
  });

  return new Response(JSON.stringify({
    ok: true,
    ...result,
    balance:          finalBal,
    serverSeed:       serverSeedRaw,   // revealed so player can verify
    serverSeedHash,
    clientSeed,
    nonce,
  }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
