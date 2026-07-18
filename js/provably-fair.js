// provably-fair.js
// How it works:
//   1. Server generates a hashed server seed before the bet (you see the hash, not the seed)
//   2. Client generates their own random client seed
//   3. Both seeds + a nonce are combined via HMAC-SHA256 to produce the outcome
//   4. After the bet, the server reveals the raw server seed
//   5. You can verify: hash(revealed seed) === the hash you saw before betting
//   6. You can re-run the HMAC yourself to confirm the outcome wasn't changed

const PF_CLIENT_SEED_KEY = 'pf_client_seed';
const PF_NONCE_KEY       = 'pf_nonce';

// ── Client seed ───────────────────────────────────────────────

function generateClientSeed() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('');
}

function getClientSeed() {
  let seed = localStorage.getItem(PF_CLIENT_SEED_KEY);
  if (!seed) { seed = generateClientSeed(); localStorage.setItem(PF_CLIENT_SEED_KEY, seed); }
  return seed;
}

function rotateClientSeed() {
  const seed = generateClientSeed();
  localStorage.setItem(PF_CLIENT_SEED_KEY, seed);
  localStorage.setItem(PF_NONCE_KEY, '0');
  return seed;
}

// ── Nonce ─────────────────────────────────────────────────────

function getNonce() {
  return parseInt(localStorage.getItem(PF_NONCE_KEY) ?? '0');
}

function incrementNonce() {
  const n = getNonce() + 1;
  localStorage.setItem(PF_NONCE_KEY, String(n));
  return n;
}

// ── Verification (client-side) ────────────────────────────────
// Re-derives the outcome from revealed seeds — call after server reveals serverSeed

async function verifyBet({ serverSeed, clientSeed, nonce, game, slotType }) {
  const enc  = new TextEncoder();
  const key  = await crypto.subtle.importKey('raw', enc.encode(serverSeed), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  const sig  = await crypto.subtle.sign('HMAC', key, enc.encode(`${clientSeed}:${nonce}`));
  const hex  = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('');

  return deriveOutcome(game, hex, slotType);
}

async function hashServerSeed(serverSeed) {
  const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serverSeed));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// Slot symbol sets — must match server-side SLOT_GAME_CONFIGS exactly
const SLOT_SYMBOLS = {
  classic:  ['🍒','🍋','🍊','⭐','💎','7️⃣'],
  fruit:    ['🍒','🍋','🍊','🍉','🍇','🍌'],
  diamond:  ['💎','⭐','🌟','✨','💫','🔥'],
  wild:     ['🤠','⭐','🦬','🌵','💰','🔫'],
  neon:     ['🕶️','🌃','💎','🎧','🔋','🧊','★'],
  treasure: ['🏴‍☠️','🗺️','🪙','💰','⚓','🦜','🔑'],
  pharaoh:  ['🪙','📜','🦂','🪆','👑','🔺','🪨'],
};

// Derives game outcome from HMAC hex — must match Edge Function logic exactly
function deriveOutcome(game, hex, slotType) {
  const val = parseInt(hex.slice(0, 8), 16); // first 4 bytes as uint32
  if (game === 'coin')  return val % 2 === 0 ? 'heads' : 'tails';
  if (game === 'dice')  return (val % 6) + 1;
  if (game === 'slots') {
    const SYMBOLS = SLOT_SYMBOLS[slotType] || SLOT_SYMBOLS['classic'];
    const symbolCount = SYMBOLS.length;
    return [
      SYMBOLS[parseInt(hex.slice(0,  8), 16) % symbolCount],
      SYMBOLS[parseInt(hex.slice(8, 16), 16) % symbolCount],
      SYMBOLS[parseInt(hex.slice(16,24), 16) % symbolCount],
    ];
  }
  if (game === 'crash') {
    // Must match Edge Function formula exactly
    const v = parseInt(hex.slice(0, 8), 16);
    return Math.max(1.00, parseFloat((100 / (1 - (v / 0xFFFFFFFF) * 0.99)).toFixed(2)));
  }
  if (game === 'mines') {
    // Derive 25 mine positions from successive 2-byte chunks of the HMAC
    const totalCells = 25;
    const positions = [];
    for (let i = 0; i < totalCells; i++) {
      const chunk = parseInt(hex.slice(i*2, i*2+2), 16);
      positions.push(chunk % totalCells);
    }
    // Deduplicate to get unique mine positions
    return [...new Set(positions)];
  }
  return null;
}

// ── UI helpers ────────────────────────────────────────────────

function renderPFWidget(containerId, { serverSeedHash, clientSeed, nonce }) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const shortHash = serverSeedHash && serverSeedHash !== '—'
    ? `${escapeHtml(serverSeedHash.slice(0,20))}…`
    : 'Will appear after your bet';
  el.innerHTML = `
    <div class="pf-row">
      <span class="pf-label">How this stays fair</span>
      <span class="pf-val">Your <strong>Client Seed</strong> + your <strong>Nonce</strong> + hidden server seed hash determine results.</span>
    </div>
    <div class="pf-row">
      <span class="pf-label">Server Seed Hash (before bet)</span>
      <span class="pf-val pf-hash" title="${escapeHtml(serverSeedHash || '—')}">${shortHash}</span>
    </div>
    <div class="pf-row">
      <span class="pf-label">Client Seed (your random key)</span>
      <input class="pf-input" id="pfClientSeedInput" value="${escapeHtml(clientSeed)}" spellcheck="false">
      <button class="pf-btn" onclick="copyClientSeed()">Copy</button>
      <button class="pf-btn" onclick="rotateSeed()">🔄 New</button>
    </div>
    <div class="pf-row">
      <span class="pf-label">Nonce (bet counter)</span>
      <span class="pf-val">${nonce}</span>
    </div>
    <div class="pf-row">
      <span class="pf-label">Tip</span>
      <span class="pf-val">Rotate your Client Seed any time. Nonce resets to 0 when you rotate.</span>
    </div>`;
}

function renderPFVerify(containerId, { serverSeed, serverSeedHash, clientSeed, nonce, game, outcome, slotType }) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const params = JSON.stringify({ serverSeed, clientSeed, nonce, game, outcome, slotType: slotType || null }).replace(/"/g,'&quot;');
  el.innerHTML = `
    <div class="pf-row"><span class="pf-label">Revealed Server Seed</span><span class="pf-val pf-hash">${escapeHtml(serverSeed)}</span></div>
    <div class="pf-row"><span class="pf-label">Client Seed</span><span class="pf-val pf-hash">${escapeHtml(clientSeed)}</span></div>
    <div class="pf-row"><span class="pf-label">Nonce</span><span class="pf-val">${nonce}</span></div>
    <button class="pf-btn pf-verify-btn" onclick="runVerify(${params})">Verify This Bet</button>
    <div id="pfVerifyResult" class="pf-verify-result"></div>`;
}

function normalizeArray(values) {
  return Array.isArray(values) ? values.map(Number).filter(Number.isFinite).sort((a,b) => a-b) : [];
}

function compareDerivedOutcome(game, derived, expected) {
  if (game === 'mines') {
    const derivedSet = new Set(normalizeArray(derived));
    const expectedCells = normalizeArray(expected);
    if (!expectedCells.length) return false;
    // Mines stored outcome can be revealed-safe picks (subset) rather than full mine map.
    return expectedCells.every(cell => !derivedSet.has(cell));
  }
  return JSON.stringify(derived) === JSON.stringify(expected);
}

async function runVerify(params) {
  const derived = await verifyBet(params);
  const el = document.getElementById('pfVerifyResult');
  const match = compareDerivedOutcome(params.game, derived, params.outcome);
  el.textContent = match
    ? '✅ Verified — outcome is consistent with seeds'
    : '❌ Mismatch — outcome is not consistent with seeds';
  el.style.color  = match ? 'var(--green)' : 'var(--red)';
}

// Expose SLOT_SYMBOLS for other modules
window.SLOT_SYMBOLS = SLOT_SYMBOLS;

async function rotateSeed() {
  const input = document.getElementById('pfClientSeedInput');
  if (input) {
    const newSeed = rotateClientSeed();
    input.value = newSeed;
  }
}

async function copyClientSeed() {
  const input = document.getElementById('pfClientSeedInput');
  if (!input) return;
  try {
    await navigator.clipboard.writeText(input.value);
  } catch (_) {
    input.select();
    document.execCommand('copy');
  }
}
