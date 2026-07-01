import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SYMBOLS = ['🍒','🍋','🍊','⭐','💎','7️⃣'];

function resolveGame(game: string, amount: number, choice: unknown) {
  if (game === 'coin') {
    const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
    const win = outcome === choice;
    return { outcome, win, delta: win ? amount : -amount };
  }
  if (game === 'dice') {
    const outcome = Math.floor(Math.random() * 6) + 1;
    const win = outcome === choice;
    return { outcome, win, delta: win ? amount * 5 : -amount };
  }
  if (game === 'slots') {
    const reels = [0,1,2].map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    let delta: number;
    if (reels[0]===reels[1] && reels[1]===reels[2])
      delta = reels[0]==='💎' ? amount*20 : reels[0]==='7️⃣' ? amount*10 : amount*5;
    else if (reels[0]===reels[1] || reels[1]===reels[2] || reels[0]===reels[2])
      delta = 0; // push — bet returned, no profit
    else
      delta = -amount;
    return { outcome: reels, win: delta > 0, delta };
  }
  throw new Error(`Unknown game: ${game}`);
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

  const { game, amount, choice } = await req.json();

  if (!['coin','dice','slots'].includes(game)) {
    return new Response(JSON.stringify({ error: 'Invalid game' }), { status: 400 });
  }
  if (!Number.isInteger(amount) || amount <= 0 || amount > 100000) {
    return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400 });
  }

  // Atomic balance deduction — fails if insufficient funds
  const { data: newBal, error: rpcErr } = await db.rpc('deduct_balance', { p_amount: amount });
  if (rpcErr) return new Response(JSON.stringify({ error: rpcErr.message }), { status: 400 });

  const result = resolveGame(game, amount, choice);
  const finalBal = (newBal as number) + (result.delta + amount); // newBal already has amount deducted

  // Credit winnings if any
  if (result.delta + amount !== 0) {
    await db.rpc('credit_balance', { p_amount: result.delta + amount });
  }

  // Fetch username for bet record
  const { data: profile } = await db.from('profiles').select('username').single();

  await db.from('bets').insert({
    user_id:       (await db.auth.getUser()).data.user?.id,
    username:      profile?.username ?? 'unknown',
    game,
    amount,
    outcome:       { result: result.outcome, win: result.win, delta: result.delta },
    balance_after: finalBal,
  });

  return new Response(JSON.stringify({ ok: true, ...result, balance: finalBal }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
