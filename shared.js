// shared.js — Supabase integration
// ─────────────────────────────────────────────────────────────
// STEP 1: Replace these two values with yours from:
//         Supabase Dashboard → Settings → API
// ─────────────────────────────────────────────────────────────
const SUPABASE_URL    = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON   = 'YOUR_ANON_PUBLIC_KEY';
// ─────────────────────────────────────────────────────────────

const { createClient } = supabase; // loaded from CDN in each HTML file
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Auth ──────────────────────────────────────────────────────

async function apiLogin(username, password) {
  // Supabase requires an email — we use username@funhouse.local as convention
  const email = username.toLowerCase() + '@funhouse.local';
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    // If login fails try registering (new user)
    const { data: signUpData, error: signUpError } = await db.auth.signUp({
      email, password,
      options: { data: { username } }
    });
    if (signUpError) return { ok: false, error: signUpError.message };
    // New user — profile created by DB trigger with balance 100
    return { ok: true, balance: 100, username };
  }
  // Existing user — fetch their balance
  const profile = await fetchProfile();
  return { ok: true, balance: profile.balance, username: profile.username };
}

async function apiLogout() {
  await db.auth.signOut();
}

async function isLoggedIn() {
  const { data: { session } } = await db.auth.getSession();
  return !!session;
}

async function getSession() {
  const { data: { session } } = await db.auth.getSession();
  return session;
}

async function fetchProfile() {
  const { data, error } = await db
    .from('profiles')
    .select('username, balance')
    .single();
  if (error) console.error('fetchProfile:', error);
  return data;
}

async function apiGetBalance() {
  const profile = await fetchProfile();
  return profile?.balance ?? 0;
}

// ── Bet ───────────────────────────────────────────────────────
// Game logic stays client-side for now.
// TODO: move resolveGame() to a Supabase Edge Function for
//       server-side verification — prevents client manipulation.

async function apiPlaceBet(game, amount, choice) {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Not logged in' };

  const profile = await fetchProfile();
  if (amount > profile.balance) return { ok: false, error: 'Insufficient balance' };

  const result   = resolveGame(game, amount, choice);
  const newBal   = profile.balance + result.delta;

  // Update balance in DB
  const { error: balErr } = await db
    .from('profiles')
    .update({ balance: newBal })
    .eq('id', session.user.id);
  if (balErr) return { ok: false, error: balErr.message };

  // Record bet (triggers realtime feed for all users)
  await db.from('bets').insert({
    user_id:       session.user.id,
    username:      profile.username,
    game,
    amount,
    outcome:       { result: result.outcome, win: result.win, delta: result.delta },
    balance_after: newBal
  });

  return { ok: true, ...result, balance: newBal };
}

function resolveGame(game, amount, choice) {
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
    const S = ['🍒','🍋','🍊','⭐','💎','7️⃣'];
    const reels = [0,1,2].map(() => S[Math.floor(Math.random() * S.length)]);
    let delta;
    if (reels[0]===reels[1] && reels[1]===reels[2])
      delta = reels[0]==='💎' ? amount*20 : reels[0]==='7️⃣' ? amount*10 : amount*5;
    else if (reels[0]===reels[1] || reels[1]===reels[2] || reels[0]===reels[2])
      delta = amount;
    else delta = -amount;
    return { outcome: reels, win: delta > 0, delta };
  }
}

// ── Realtime feed ─────────────────────────────────────────────
// Subscribes to all new bets across all users — powers the live feed
function connectRealtime(onBet) {
  db.channel('bets')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'bets' },
      payload => onBet(payload.new)
    )
    .subscribe(status => {
      const dot = document.getElementById('statusDot');
      if (dot) dot.classList.toggle('online', status === 'SUBSCRIBED');
    });
}

// ── Nav helpers ───────────────────────────────────────────────
async function guardPage() {
  const loggedIn = await isLoggedIn();
  if (!loggedIn) window.location.href = 'index.html';
}

async function initNav() {
  const profile = await fetchProfile();
  const ul  = document.getElementById('userLabel');
  const bal = document.getElementById('bal');
  if (ul  && profile) ul.textContent  = profile.username;
  if (bal && profile) bal.textContent = profile.balance;
}

async function doLogout() {
  await apiLogout();
  window.location.href = 'index.html';
}

function updateBal(n) {
  const el = document.getElementById('bal');
  if (el) el.textContent = n;
}
