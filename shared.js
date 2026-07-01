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

// In-memory balance — never read from DOM (Fix #5)
let currentBalance = 0;

// ── Helpers ───────────────────────────────────────────────────

function escapeHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Auth ──────────────────────────────────────────────────────

async function apiLogin(username, password) {
  const email = username.toLowerCase() + '@funhouse.local';
  const { data, error } = await db.auth.signInWithPassword({ email, password });

  if (!error) {
    const profile = await fetchProfile();
    currentBalance = profile.balance;
    return { ok: true, balance: profile.balance, username: profile.username };
  }

  // Fix #3 — only auto-register when the account genuinely doesn't exist
  if (error.message.toLowerCase().includes('invalid login credentials')) {
    const { error: signUpError } = await db.auth.signUp({
      email, password,
      options: { data: { username } }
    });
    if (signUpError) return { ok: false, error: signUpError.message };
    currentBalance = 100;
    return { ok: true, balance: 100, username };
  }

  return { ok: false, error: error.message };
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
// Game logic runs server-side in the Edge Function (Fix #1 + #2)

async function apiPlaceBet(game, amount, choice) {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Not logged in' };

  // Fix #5 — use in-memory balance, not DOM
  if (amount > currentBalance) return { ok: false, error: 'Insufficient balance' };

  const res = await fetch(`${SUPABASE_URL}/functions/v1/place-bet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ game, amount, choice }),
  });

  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error ?? 'Server error' };

  currentBalance = data.balance;
  return { ok: true, ...data };
}

// ── Realtime feed ─────────────────────────────────────────────

let _realtimeChannel = null;

function connectRealtime(onBet) {
  // Fix #10 — remove existing subscription before creating a new one
  if (_realtimeChannel) db.removeChannel(_realtimeChannel);

  _realtimeChannel = db.channel('bets')
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
  if (!profile) return;
  currentBalance = profile.balance;
  const ul  = document.getElementById('userLabel');
  const bal = document.getElementById('bal');
  // Fix #4 — use textContent, not innerHTML, for user-supplied data
  if (ul)  ul.textContent  = profile.username;
  if (bal) bal.textContent = profile.balance;
}

async function doLogout() {
  await apiLogout();
  window.location.href = 'index.html';
}

function updateBal(n) {
  currentBalance = n;
  const el = document.getElementById('bal');
  if (el) el.textContent = n;
}
