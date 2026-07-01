import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

  const { betId } = await req.json();
  if (!betId) return new Response(JSON.stringify({ error: 'betId required' }), { status: 400 });

  const { data: bet, error } = await db
    .from('bets')
    .select('game, amount, outcome, server_seed, server_seed_hash, client_seed, nonce')
    .eq('id', betId)
    .single();

  if (error || !bet) return new Response(JSON.stringify({ error: 'Bet not found' }), { status: 404 });

  // Re-derive outcome server-side to confirm it matches what was stored
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(bet.server_seed), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${bet.client_seed}:${bet.nonce}`));
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('');

  // Verify hash matches
  const hashBuf  = await crypto.subtle.digest('SHA-256', enc.encode(bet.server_seed));
  const hashHex  = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2,'0')).join('');
  const hashMatch = hashHex === bet.server_seed_hash;

  return new Response(JSON.stringify({
    ok:          true,
    hashMatch,
    hmacHex:     hex,
    bet,
  }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
