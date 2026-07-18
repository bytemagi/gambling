// shared.js — Supabase integration
// ─────────────────────────────────────────────────────────────
// STEP 1: Replace these two values with yours from:
//         Supabase Dashboard → Settings → API
// ─────────────────────────────────────────────────────────────
const SUPABASE_URL    = 'https://lxzpltvuauzkgddjsplb.supabase.co';
const SUPABASE_ANON   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4enBsdHZ1YXV6a2dkZGpzcGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTE0ODYsImV4cCI6MjA5ODQyNzQ4Nn0.RgL6Pw7yT6d06bywn7m7EmewnW5EvmCC0V781H6ys5A';
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

async function apiLogin(username, password, referralCode = '') {
  const email = username.toLowerCase() + '@funhouse.local';
  const normalizedReferralCode = (referralCode || '').trim().toUpperCase();
  const { data, error } = await db.auth.signInWithPassword({ email, password });

  if (!error) {
    const profile = await fetchProfile();
    currentBalance = profile.balance;
    return { ok: true, balance: profile.balance, username: profile.username };
  }

  // Fix #3 — only auto-register when the account genuinely doesn't exist
  if (error.message.toLowerCase().includes('invalid login credentials')) {
    const { data: signUpData, error: signUpError } = await db.auth.signUp({
      email, password,
      options: { data: { username, referral_code: normalizedReferralCode } }
    });
    if (signUpError) return { ok: false, error: signUpError.message };

    const signInResult = await db.auth.signInWithPassword({ email, password });
    if (!signInResult.error && signInResult.data?.session?.access_token) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/handle-signup-bonus`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${signInResult.data.session.access_token}`,
          },
          body: JSON.stringify({
            userId: signInResult.data.user?.id || signUpData?.user?.id,
            referralCode: normalizedReferralCode,
            username,
          }),
        });
      } catch (bonusErr) {
        console.warn('Referral bonus processing failed:', bonusErr);
      }
    }

    // Wait a moment for the edge function to complete, then fetch actual balance
    await new Promise(r => setTimeout(r, 500));
    const postProfile = await fetchProfile();
    currentBalance = postProfile?.balance ?? 100;
    return { ok: true, balance: currentBalance, username };
  }

  return { ok: false, error: error.message };
}

async function apiLogout() {
  await db.auth.signOut();
}

function doLogout() {
  apiLogout().then(() => { window.location.href = 'index.html'; });
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
    .select('username, balance, free_spins, referral_code, referred_by')
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

async function apiPlaceBet(game, amount, choice, providedClientSeed = null, providedNonce = null) {
  try {
    const session = await getSession();
    if (!session) return { ok: false, error: 'Not logged in' };

    // Validate balance before placing bet
    const balance = await apiGetBalance();
    if (!(choice && choice.useFreeSpin) && amount > balance) {
      return { ok: false, error: 'Insufficient balance' };
    }

    const clientSeed = providedClientSeed || getClientSeed();
    const nonce      = Number.isInteger(providedNonce) ? providedNonce : incrementNonce();

    let res;
    try {
      res = await fetch(`${SUPABASE_URL}/functions/v1/place-bet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ game, amount, choice, clientSeed, nonce }),
      });
    } catch (networkErr) {
      return { ok: false, error: 'Network error while placing bet' };
    }

    let data = null;
    try {
      data = await res.json();
    } catch (parseErr) {
      data = null;
    }

    if (!res.ok) {
      return {
        ok: false,
        error: data?.error ?? `Server error (${res.status})`,
      };
    }

    if (!data || typeof data.balance !== 'number') {
      return { ok: false, error: 'Invalid server response' };
    }

  currentBalance = data.balance;
  if (typeof window !== 'undefined' && typeof data.freeSpinsRemaining === 'number') {
    localStorage.setItem('freeSpins', String(data.freeSpinsRemaining));
    if (typeof window.updateFreeSpinDisplay === 'function') {
      window.updateFreeSpinDisplay();
    }
  }
    return { ok: true, ...data };
  } catch (err) {
    return { ok: false, error: 'Unexpected error while placing bet' };
  }
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
  if (!loggedIn) { window.location.href = 'index.html'; return; }
  await initNav();
}

async function initNav() {
  const profile = await fetchProfile();
  if (!profile) return;
  currentBalance = profile.balance;
  if (typeof window !== 'undefined') {
    localStorage.setItem('freeSpins', String(profile.free_spins ?? 0));
    if (typeof window.updateFreeSpinDisplay === 'function') {
      window.updateFreeSpinDisplay();
    }
  }
  const ul  = document.getElementById('userLabel');
  const bal = document.getElementById('bal');
  if (ul)  ul.textContent  = profile.username;
  if (bal) bal.textContent = profile.balance;
}

function updateBal(n) {
  currentBalance = n;
  const el = document.getElementById('bal');
  if (el) el.textContent = n;
}

// ── Loading state helper ──────────────────────────────────────

function setButtonLoading(btnId, loading, originalText) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = 'Loading...';
  } else {
    btn.textContent = originalText || btn.dataset.originalText || btn.textContent;
  }
}

// ── Shared bet helpers (eliminates duplication across game pages) ──

function setQuickBet(n) {
  const b = currentBalance || n;
  document.getElementById('betAmt').value = Math.min(n, b);
  if (typeof updatePotential === 'function') updatePotential();
}

function halfBet() {
  const el = document.getElementById('betAmt');
  el.value = Math.max(1, Math.floor(parseInt(el.value || 1) / 2));
  if (typeof updatePotential === 'function') updatePotential();
}

function doubleBet() {
  const b = currentBalance || 99999;
  const el = document.getElementById('betAmt');
  el.value = Math.min(parseInt(el.value || 1) * 2, b);
  if (typeof updatePotential === 'function') updatePotential();
}

// ── Shared particles ──────────────────────────────────────────

function spawnParticles(count) {
  const countVal = count || 20;
  const emojis = ['💎', '⭐', '🎉', '✨', '💰', '🎊', '🔥'];
  const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  for (let i = 0; i < countVal; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = Math.random() * Math.PI * 2, dist = 100 + Math.random() * 200;
    p.style.cssText = `left:${cx}px;top:${cy}px;--tx:${Math.cos(angle) * dist}px;--ty:${Math.sin(angle) * dist}px;`;
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1100);
  }
}

// ── Sound toggle (global, persisted in localStorage) ──────────

let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';

function initSoundToggle() {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('soundToggle');
  if (existing) {
    existing.textContent = soundEnabled ? '🔊' : '🔇';
    return;
  }
  const btn = document.createElement('button');
  btn.id = 'soundToggle';
  btn.title = 'Toggle Sound';
  btn.setAttribute('aria-label', 'Toggle sound');
  btn.textContent = soundEnabled ? '🔊' : '🔇';
  btn.onclick = toggleSound;
  document.body.appendChild(btn);
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem('soundEnabled', soundEnabled);
  const btn = document.getElementById('soundToggle');
  if (btn) {
    btn.textContent = soundEnabled ? '🔊' : '🔇';
    btn.style.transform = 'scale(1.25)';
    setTimeout(() => btn.style.transform = '', 200);
  }
}
