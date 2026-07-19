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

async function apiLogin(username, password) {
  const email = username.toLowerCase() + '@funhouse.local';
  const { error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, error: error.message };
  }

  const profile = await fetchProfile();
  if (!profile) {
    return { ok: false, error: 'Could not load profile. Please try again.' };
  }
  currentBalance = profile.balance;
  return { ok: true, balance: profile.balance, username: profile.username };
}

async function apiSignup(username, password, referralCode = '') {
  const email = username.toLowerCase() + '@funhouse.local';
  const normalizedReferralCode = String(referralCode || '').trim().toUpperCase();

  // Block sign-up if the username/email already exists
  const { error: signInError } = await db.auth.signInWithPassword({ email, password: 'probe' });
  const alreadyExists = !signInError || !signInError.message.toLowerCase().includes('invalid login credentials');
  if (alreadyExists) {
    return { ok: false, error: 'Username already taken. Try logging in instead.' };
  }

  const { data: signUpData, error: signUpError } = await db.auth.signUp({
    email,
    password,
    options: { data: { username, referral_code: normalizedReferralCode } }
  });

  if (signUpError) {
    return { ok: false, error: signUpError.message };
  }

  // Sign in to get a session, then fetch the profile balance
  const signInResult = await db.auth.signInWithPassword({ email, password });
  if (signInResult.error || !signInResult.data?.session?.access_token) {
    return { ok: false, error: 'Account created but unable to sign in automatically.' };
  }

  const postProfile = await fetchProfile();
  currentBalance = postProfile?.balance ?? 0;
  return { ok: true, balance: currentBalance, username };
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
    const isFreeSpin = choice && typeof choice === 'object' && choice.useFreeSpin === true;
    if (!isFreeSpin && amount > balance) {
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
  initHamburger();
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

function spawnParticles(countOrColor) {
  const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  // If a color string is passed, spawn colored dots; otherwise spawn emoji particles
  if (typeof countOrColor === 'string') {
    const color = countOrColor;
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = 6 + Math.random() * 8;
      const angle = Math.random() * Math.PI * 2, dist = 80 + Math.random() * 160;
      p.style.cssText = `width:${size}px;height:${size}px;background:${color};left:${cx}px;top:${cy}px;--tx:${Math.cos(angle)*dist}px;--ty:${Math.sin(angle)*dist}px;`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 900);
    }
  } else {
    const countVal = countOrColor || 20;
    const emojis = ['💎', '⭐', '🎉', '✨', '💰', '🎊', '🔥'];
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
}

// ── Shared game UI helpers ────────────────────────────────────

function setResult(msg, cls) {
  const el = document.getElementById('result');
  if (!el) return;
  el.textContent = msg;
  el.className = 'result-banner ' + cls;
}

function updatePotential() {
  const amtEl = document.getElementById('betAmt');
  const el = document.getElementById('potential');
  if (!amtEl || !el) return;
  const amt = parseFloat(amtEl.value) || 0;
  const mult = parseFloat(document.getElementById('autoCashout')?.value) || 1;
  el.innerHTML = `Potential win: <span>$${(amt * mult).toFixed(2)}</span>`;
}

// ── Shared header/footer (eliminates 9x copy-paste) ───────────

const NAV_ITEMS = [
  { page: 'index.html',      icon: '🏠', label: 'Lobby' },
  { page: 'fish.html',       icon: '🐟', label: 'Fish Frenzy', badge: 'new' },
  { page: 'slots.html',      icon: '🎰', label: 'Slots',        badge: 'hot' },
  { page: 'crash.html',      icon: '🚀', label: 'Crash' },
  { page: 'mines.html',      icon: '💣', label: 'Mines' },
  { page: 'coin.html',       icon: '🪙', label: 'Coin Flip' },
  { page: 'dice.html',       icon: '🎲', label: 'Dice' },
  { page: 'leaderboard.html',icon: '🏆', label: 'Leaderboard' },
  { page: 'wallet.html',     icon: '💳', label: 'Wallet' },
];

const FOOTER_ITEMS = [
  { page: 'index.html',      icon: '🏠', label: 'Lobby' },
  { page: 'slots.html',      icon: '🎰', label: 'Slots' },
  { page: 'crash.html',      icon: '🚀', label: 'Crash' },
  { page: 'mines.html',      icon: '💣', label: 'Mines' },
  { page: 'coin.html',       icon: '🪙', label: 'Coin' },
  { page: 'dice.html',       icon: '🎲', label: 'Dice' },
  { page: 'leaderboard.html',icon: '🏆', label: 'Leaderboard' },
  { page: 'wallet.html',     icon: '💳', label: 'Wallet' },
  { page: 'history.html',    icon: '📋', label: 'History' },
];

function renderSiteHeader(activePage) {
  const navLinks = NAV_ITEMS.map(item => {
    const active = item.page === activePage ? ' active' : '';
    const badge = item.badge ? ` <span class="nav-badge ${item.badge}">${item.badge === 'new' ? 'NEW' : 'HOT'}</span>` : '';
    return `      <a class="nav-link${active}" href="${item.page}"><span class="nav-icon">${item.icon}</span> ${item.label}${badge}</a>`;
  }).join('\n');

  return `<header class="site-header">
  <div class="header-top">
    <a class="header-logo-wrap" href="index.html">
      <img src="../logo.svg" class="graffiti-logo-sm" alt="Fuckitt's Funhouse">
    </a>
    <button class="hamburger-btn" id="hamburgerBtn" aria-label="Toggle navigation">
      <span></span><span></span><span></span>
    </button>
    <nav class="header-nav" id="headerNav">
${navLinks}
    </nav>
    <div class="header-right">
      <div class="balance-chip">
        <span class="balance-chip-icon">💰</span>
        <div class="balance-chip-inner">
          <span class="balance-chip-label">Balance</span>
          <span class="balance-chip-amount">$<span id="bal">0</span></span>
        </div>
      </div>
      <div class="user-chip">
        <span class="dot online" id="statusDot"></span>
        <span id="userLabel"></span>
      </div>
      <button class="btn-ghost" onclick="doLogout()">Sign Out</button>
    </div>
  </div>
</header>`;
}

function renderSiteFooter() {
  const links = FOOTER_ITEMS.map(item =>
    `    <a href="${item.page}">${item.icon} ${item.label}</a>`
  ).join('\n');

  return `<footer class="site-footer" style="padding:36px 24px 28px;text-align:center;margin-top:60px">
  <img src="../logo.svg" class="graffiti-logo-xs" alt="Fuckitt's Funhouse" style="margin:0 auto 18px">
  <div class="footer-links" style="margin-bottom:18px">
${links}
  </div>
  <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <span class="footer-badge green">✓ Provably Fair</span>
    <span class="footer-badge gold">⚡ Instant Payouts</span>
    <span class="footer-badge">🔒 Secure · Est. 2024</span>
  </div>
  <div class="footer-copy">© 2024 Fuckitt's Funhouse · For entertainment purposes only</div>
</footer>`;
}

function initLayout(activePage) {
  const headerEl = document.getElementById('siteHeader');
  const footerEl = document.getElementById('siteFooter');
  if (headerEl) headerEl.innerHTML = renderSiteHeader(activePage);
  if (footerEl) footerEl.innerHTML = renderSiteFooter();
  initHamburger();
}

function initHamburger() {
  const btn = document.getElementById('hamburgerBtn');
  const nav = document.getElementById('headerNav');
  if (!btn || !nav) return;
  btn.onclick = () => {
    nav.classList.toggle('open');
    btn.classList.toggle('open');
  };
  nav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      btn.classList.remove('open');
    });
  });
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
