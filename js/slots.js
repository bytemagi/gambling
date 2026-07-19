// slots.js — Main Slots Game Controller
// Uses slots-engine.js for core logic

// ── INITIALIZATION ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await guardPage();
  initSoundToggle();

  // Get game ID from URL or default
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get('game') || 'classic';

  // Initialize the slot engine
  try {
    await SLOTS_ENGINE.init(gameId);
    console.log('🎰 Slots game ready:', gameId);
  } catch (error) {
    console.error('Failed to initialize slots:', error);
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:20px;padding:20px;">
        <h1 style="color:var(--red)">Failed to Load Game</h1>
        <p style="color:var(--text-muted)">${error.message}</p>
        <a href="index.html" class="btn btn-primary">Back to Lobby</a>
      </div>
    `;
  }
});

// ── GAME SELECTOR (if on lobby or multi-game page) ─────────────
function initGameSelector() {
  const selector = document.querySelector('.game-selector-grid');
  if (!selector) return;

  selector.addEventListener('click', (e) => {
    const card = e.target.closest('.selector-card');
    if (card) {
      const gameId = card.dataset.game;
      window.location.href = `slots.html?game=${gameId}`;
    }
  });
}

if (document.querySelector('.game-selector-grid')) {
  initGameSelector();
}

function addHistory(reels, win, jackpot, bet, gain) {
  const list = document.getElementById('historyList');
  const item = document.createElement('div');
  item.className = 'history-item ' + (jackpot ? 'jackpot' : win ? 'win' : 'lose');
  item.innerHTML = `<span>${reels.join(' ')}</span><span class="h-amt">${win ? '+' : '−'}$${win ? gain : bet}</span>`;
  list.prepend(item);
  if (list.children.length > 8) list.lastChild.remove();
}
