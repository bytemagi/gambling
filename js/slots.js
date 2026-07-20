// slots.js — Main Slots Game Controller
// Uses slots-engine.js for core logic. Server is the source of truth for outcomes.

// ── GAME SELECTOR ─────────────────────────────────────────────
function renderSelector() {
  const grid = document.getElementById('selectorGrid');
  if (!grid) return;

  const games = SLOTS_ENGINE.GAMES;
  grid.innerHTML = Object.values(games).map(g => `
    <button class="selector-card" data-game="${g.id}" data-category="${g.category}">
      <div class="selector-icon">${g.icon}</div>
      <div class="selector-name">${g.name}</div>
      <div class="selector-meta">
        <span>RTP ${g.rtp}%</span>
        <span>${g.volatility}</span>
      </div>
    </button>
  `).join('');

  grid.querySelectorAll('.selector-card').forEach(card => {
    card.addEventListener('click', () => {
      const gameId = card.dataset.game;
      window.location.href = `slots.html?game=${gameId}`;
    });
  });
}

function initSelectorTabs() {
  const tabs = document.querySelectorAll('.selector-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.category;
      document.querySelectorAll('.selector-card').forEach(card => {
        const show = cat === 'all' || card.dataset.category === cat;
        card.style.display = show ? '' : 'none';
      });
    });
  });
}

// ── INITIALIZATION ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await guardPage();
  initSoundToggle();

  renderSelector();
  initSelectorTabs();

  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get('game') || 'classic';

  // Toggle selector vs game area
  const selector = document.getElementById('gameSelector');
  const gameArea = document.getElementById('gameArea');
  if (selector) selector.style.display = 'none';
  if (gameArea) gameArea.style.display = '';

  try {
    await SLOTS_ENGINE.init(gameId);
    console.log('🎰 Slots game ready:', gameId);
  } catch (error) {
    console.error('Failed to initialize slots:', error);
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:20px;padding:20px;">
        <h1 style="color:var(--red)">Failed to Load Game</h1>
        <p style="color:var(--text-muted)">${error.message}</p>
        <a href="slots.html" class="btn btn-primary">Back to Slots</a>
      </div>
    `;
  }
});

// Back to selector
document.getElementById('backToSelector')?.addEventListener('click', () => {
  window.location.href = 'slots.html';
});

// ── HISTORY ───────────────────────────────────────────────────
function addHistory(reels, win, jackpot, bet, gain) {
  const list = document.getElementById('historyList');
  if (!list) return;
  const item = document.createElement('div');
  item.className = 'history-item ' + (jackpot ? 'jackpot' : win ? 'win' : 'lose');
  item.innerHTML = `<span>${reels.join(' ')}</span><span class="h-amt">${win ? '+' : '−'}$${win ? gain : bet}</span>`;
  list.prepend(item);
  if (list.children.length > 8) list.lastChild.remove();
}
