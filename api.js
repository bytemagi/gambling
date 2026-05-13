// api.js — Backend integration layer
// TODO: Replace BASE_URL with your actual server address
const BASE_URL = 'https://your-api-server.com';

// --- Auth ---
// TODO: Replace with real login endpoint (JWT, session, etc.)
export async function login(username, password) {
  // STUB — remove and uncomment fetch below when backend is ready
  if (username && password) {
    const fakeToken = btoa(`${username}:${Date.now()}`);
    sessionStorage.setItem('token', fakeToken);
    sessionStorage.setItem('user', username);
    return { ok: true, token: fakeToken, balance: 100 };
  }
  return { ok: false, error: 'Invalid credentials' };

  /* REAL IMPLEMENTATION:
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (data.token) sessionStorage.setItem('token', data.token);
  return data;
  */
}

export function logout() {
  sessionStorage.clear();
  ws?.close();
}

export function getToken() { return sessionStorage.getItem('token'); }
export function getUser()  { return sessionStorage.getItem('user'); }
export function isLoggedIn() { return !!getToken(); }

// --- Balance ---
// TODO: Fetch real balance from DB on load and after each bet
export async function fetchBalance() {
  // STUB
  return { balance: parseInt(sessionStorage.getItem('balance') ?? 100) };

  /* REAL IMPLEMENTATION:
  const res = await fetch(`${BASE_URL}/user/balance`, { headers: authHeaders() });
  return res.json();
  */
}

// --- Bet Verification ---
// All game outcomes should eventually be verified server-side.
// The server generates the random result, not the client.
// TODO: Implement each game endpoint on the backend.
export async function placeBet({ game, amount, choice }) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Not logged in' };

  // STUB — client-side RNG, replace with server call
  const result = resolveLocally(game, choice);
  const newBalance = (parseInt(sessionStorage.getItem('balance') ?? 100)) + result.delta;
  if (newBalance < 0) return { ok: false, error: 'Insufficient balance' };
  sessionStorage.setItem('balance', newBalance);
  return { ok: true, ...result, balance: newBalance };

  /* REAL IMPLEMENTATION:
  const res = await fetch(`${BASE_URL}/bet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ game, amount, choice })
  });
  return res.json();
  // Server response shape: { ok, outcome, delta, balance, txId }
  */
}

function authHeaders() {
  return { 'Authorization': `Bearer ${getToken()}` };
}

// Temporary local RNG — DELETE when server handles outcomes
function resolveLocally(game, { amount, choice, guess }) {
  if (game === 'coin') {
    const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
    const win = outcome === choice;
    return { outcome, win, delta: win ? amount : -amount };
  }
  if (game === 'dice') {
    const outcome = Math.floor(Math.random() * 6) + 1;
    const win = outcome === guess;
    return { outcome, win, delta: win ? amount * 5 : -amount };
  }
  if (game === 'slots') {
    const SYMBOLS = ['🍒','🍋','🍊','⭐','💎','7️⃣'];
    const reels = Array.from({length:3}, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    let delta;
    if (reels[0]===reels[1] && reels[1]===reels[2]) {
      delta = reels[0]==='💎' ? amount*20 : reels[0]==='7️⃣' ? amount*10 : amount*5;
    } else if (reels[0]===reels[1] || reels[1]===reels[2] || reels[0]===reels[2]) {
      delta = amount;
    } else {
      delta = -amount;
    }
    return { outcome: reels, win: delta > 0, delta };
  }
}

// --- WebSocket (realtime balance + feed updates) ---
// TODO: Replace with your real WS server URL
let ws = null;
const WS_URL = 'wss://your-api-server.com/ws';

export function connectWS(onMessage) {
  if (!isLoggedIn()) return;

  // STUB — no real WS yet, just logs
  console.log('[WS] Would connect to', WS_URL);
  return;

  /* REAL IMPLEMENTATION:
  ws = new WebSocket(`${WS_URL}?token=${getToken()}`);
  ws.onopen    = () => console.log('[WS] Connected');
  ws.onmessage = (e) => onMessage(JSON.parse(e.data));
  ws.onclose   = () => setTimeout(() => connectWS(onMessage), 3000); // auto-reconnect
  ws.onerror   = (e) => console.error('[WS] Error', e);
  */
}
