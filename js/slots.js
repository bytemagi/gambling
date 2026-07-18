guardPage();
initSoundToggle();
renderPFWidget('pfWidget', { serverSeedHash: '—', clientSeed: getClientSeed(), nonce: getNonce() });

// ── SLOT GAME CONFIGURATIONS ───────────────────────────────────
const GAME_CONFIGS = {
  classic: {
    name: 'Classic 7s',
    icon: '🎰',
    symbols: ['🍒','🍋','🍊','⭐','💎','7️⃣'],
    payouts: {
      '💎': 20,
      '7️⃣': 10,
      '⭐': 5,
      '🍒': 5
    },
    bonusFeatures: ['progressive-jackpot'],
    machineTheme: 'purple',
    soundTheme: 'classic'
  },
  fruit: {
    name: 'Fruit Fiesta',
    icon: '🍒',
    symbols: ['🍒','🍋','🍊','🍉','🍇','🍌'],
    payouts: {
      '🍇': 15,
      '🍉': 10,
      '🍊': 8,
      '🍋': 6,
      '🍌': 5,
      '🍒': 5
    },
    bonusFeatures: ['free-spins', 'multiplier'],
    machineTheme: 'tropical',
    soundTheme: 'fruit'
  },
  diamond: {
    name: 'Diamond Rush',
    icon: '💎',
    symbols: ['💎','⭐','🌟','✨','💫','🔥'],
    payouts: {
      '💎': 25,
      '🔥': 15,
      '💫': 10,
      '✨': 8,
      '🌟': 6,
      '⭐': 5
    },
    bonusFeatures: ['mega-multiplier', 'bonus-round'],
    machineTheme: 'gold',
    soundTheme: 'luxury'
  },
  wild: {
    name: 'Wild West',
    icon: '🤠',
    symbols: ['🤠','⭐','🦬','🌵','💰','🔫'],
    payouts: {
      '🤠': 20,
      '💰': 15,
      '🦬': 10,
      '⭐': 8,
      '🌵': 6,
      '🔫': 5
    },
    bonusFeatures: ['wild-substitution', 'bounty-bonus'],
    machineTheme: 'western',
    soundTheme: 'western'
  },
  neon: {
    name: 'Neon Nights',
    icon: '🌃',
    symbols: ['🕶️','🌃','💎','🎧','🔋','🧊','★'],
    payouts: {
      '💎': 50,
      '★': 25,
      '🎧': 12,
      '🕶️': 10,
      '🌃': 8,
      '🔋': 6,
      '🧊': 5
    },
    bonusFeatures: ['neon-wilds'],
    machineTheme: 'purple',
    soundTheme: 'classic'
  },
  treasure: {
    name: 'Treasure Quest',
    icon: '🏴‍☠️',
    symbols: ['🏴‍☠️','🗺️','🪙','💰','⚓','🦜','🔑'],
    payouts: {
      '💰': 40,
      '🪙': 20,
      '🗺️': 12,
      '🏴‍☠️': 10,
      '⚓': 8,
      '🦜': 6,
      '🔑': 5
    },
    bonusFeatures: ['treasure-hunt'],
    machineTheme: 'gold',
    soundTheme: 'luxury'
  },
  pharaoh: {
    name: "Pharaoh's Riches",
    icon: '👑',
    symbols: ['🪙','📜','🦂','🪆','👑','🔺','🪨'],
    payouts: {
      '👑': 30,
      '🔺': 18,
      '🪆': 12,
      '🦂': 10,
      '📜': 8,
      '🪙': 6,
      '🪨': 4
    },
    bonusFeatures: ['expanding-wild'],
    machineTheme: 'gold',
    soundTheme: 'luxury'
  }
};

let currentGame = 'classic';
let useFreeSpin = false;

function getFreeSpins() {
  return Number(localStorage.getItem('freeSpins') || '0');
}

function setFreeSpins(n) {
  localStorage.setItem('freeSpins', String(n));
}

function updateFreeSpinDisplay() {
  const countEl = document.getElementById('freeSpinCount');
  const buttonEl = document.getElementById('btnFreeSpin');
  const available = getFreeSpins();
  if (countEl) countEl.textContent = String(available);
  if (buttonEl) {
    buttonEl.disabled = available <= 0;
    buttonEl.textContent = useFreeSpin ? 'Using Free Spin' : 'Use Free Spin';
    buttonEl.style.opacity = available <= 0 ? '0.6' : '1';
  }
}

function toggleFreeSpin() {
  const available = getFreeSpins();
  if (available <= 0) return;
  useFreeSpin = !useFreeSpin;
  updateFreeSpinDisplay();
}

// ── GAME SELECTION ─────────────────────────────────────────────
function selectGame(gameType) {
  currentGame = gameType;
  const config = GAME_CONFIGS[gameType];
  
  // Update UI
  document.querySelectorAll('.game-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.game === gameType);
  });
  
  // Update machine theme
  const machine = document.querySelector('.machine');
  machine.className = 'machine theme-' + config.machineTheme;
  
  // Update machine title
  const machineTitle = document.getElementById('machineTitle');
  if (machineTitle) {
    machineTitle.textContent = `✦ ${config.name} ✦`;
  }
  
  // Update paytable
  updatePaytable(config);
  
  // Play selection sound
  soundClick();
  
  // Reset reels
  [1, 2, 3].forEach(n => {
    const strip = document.getElementById('rs' + n);
    strip.innerHTML = '<div class="reel-symbol">❓</div>';
  });
  
  setResult(`Selected: ${config.name} — ${config.icon}`, 'idle');
}

function updatePaytable(config) {
  const paytable = document.querySelector('.paytable');
  let html = '<div class="paytable-title">Paytable — ' + config.name + '</div>';
  
  // Sort payouts by value descending
  const sortedSymbols = config.symbols
    .filter(sym => config.payouts[sym])
    .sort((a, b) => config.payouts[b] - config.payouts[a]);
  
  sortedSymbols.forEach(sym => {
    const mult = config.payouts[sym];
    const label = mult >= 20 ? 'MEGA JACKPOT' : mult >= 10 ? 'JACKPOT' : mult >= 8 ? 'BIG WIN' : '';
    html += `<div class="pay-row"><span class="pay-symbols">${sym}${sym}${sym}</span><span class="pay-mult">${mult}× BET${label ? ' — ' + label : ''}</span></div>`;
  });
  
  html += '<div class="pay-row"><span class="pay-symbols">Any pair</span><span class="pay-mult" style="color:var(--muted)">Push — bet returned</span></div>';
  html += '<div class="pay-row"><span class="pay-symbols">No match</span><span style="color:var(--red)">Lose bet</span></div>';
  
  // Add bonus features
  if (config.bonusFeatures.length > 0) {
    html += '<div class="pay-row" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--gold)"><span class="pay-symbols">🎁</span><span class="pay-mult" style="color:var(--gold)">Bonuses: ' + config.bonusFeatures.map(b => b.replace('-', ' ')).join(', ') + '</span></div>';
  }
  
  paytable.innerHTML = html;
}

function buildStrip(finalSymbol) {
  const config = GAME_CONFIGS[currentGame];
  const count = 14;
  let html = '';
  for (let i = 0; i < count; i++) {
    const sym = config.symbols[Math.floor(Math.random() * config.symbols.length)];
    html += `<div class="reel-symbol">${sym}</div>`;
  }
  html += `<div class="reel-symbol">${finalSymbol}</div>`;
  return html;
}

async function spin() {
  const amount = parseInt(document.getElementById('betAmt').value) || 0;
  if (amount <= 0) {
    setResult('Invalid bet amount', 'idle');
    return;
  }

  document.getElementById('btnSpin').disabled = true;
  setResult('Spinning...', 'idle');

  const config = GAME_CONFIGS[currentGame];
  
  // Play game-specific spin sound
  playGameSound('spin');
  
  const [res] = await Promise.all([
    apiPlaceBet('slots', amount, { gameType: currentGame, useFreeSpin }),
    new Promise(r => setTimeout(r, 1400))
  ]);

  document.getElementById('btnSpin').disabled = false;

  if (!res.ok) {
    setResult('Error: ' + res.error, 'idle');
    return;
  }

  [1, 2, 3].forEach((n, i) => {
    const strip = document.getElementById('rs' + n);
    strip.innerHTML = buildStrip(res.outcome[i]);
    strip.style.setProperty('--steps', 14);
    strip.style.setProperty('--dur', (0.6 + i * 0.25) + 's');
    strip.classList.remove('spinning');
    void strip.offsetWidth;
    strip.classList.add('spinning');
  });

  // Wait for the longest reel animation (reel 3 = 1.1s) then show result
  await new Promise(r => setTimeout(r, 1150));

  [1, 2, 3].forEach(n => {
    const strip = document.getElementById('rs' + n);
    strip.classList.remove('spinning');
    strip.innerHTML = `<div class="reel-symbol">${res.outcome[n - 1]}</div>`;
    strip.style.transform = '';
  });

  if (typeof res.freeSpinsRemaining === 'number') {
    setFreeSpins(Number(res.freeSpinsRemaining));
  } else if (useFreeSpin && getFreeSpins() > 0) {
    setFreeSpins(Math.max(0, getFreeSpins() - 1));
  }
  updateFreeSpinDisplay();
  updateBal(res.balance);

  const gain = Math.abs(res.delta);
  const multiplier = res.delta / amount;
  
  // Determine win type based on game-specific payouts
  const isJackpot = multiplier >= 10;
  const isBigWin = multiplier >= 5 && !isJackpot;

  if (res.win && isJackpot) {
    playGameSound('jackpot');
    const jackpotLabel = multiplier >= 20 ? '💎 MEGA JACKPOT' : '7️⃣ JACKPOT';
    setResult(jackpotLabel + '! YOU WIN $' + gain + '!', 'jackpot-win');
    [1, 2, 3].forEach(n => document.getElementById('rw' + n).classList.add('jackpot'));
    setTimeout(() => [1, 2, 3].forEach(n => document.getElementById('rw' + n).classList.remove('jackpot')), 2000);
    spawnParticles(30);
  } else if (res.win && isBigWin) {
    playGameSound('win');
    setResult('🎉 THREE OF A KIND — YOU WIN $' + gain + '!', 'win');
    spawnParticles(12);
  } else if (res.win) {
    playGameSound('win');
    setResult('✨ YOU WIN $' + gain + '!', 'win');
    spawnParticles(8);
  } else if (res.delta === 0) {
    setResult('🤝 TWO OF A KIND — BET RETURNED', 'idle');
  } else {
    playGameSound('lose');
    setResult('💀 NO MATCH — YOU LOSE $' + amount, 'lose');
  }

  addHistory(res.outcome, res.win, isJackpot, amount, gain);

  renderPFVerify('pfWidget', {
    serverSeed: res.serverSeed,
    serverSeedHash: res.serverSeedHash,
    clientSeed: res.clientSeed,
    nonce: res.nonce,
    game: 'slots',
    outcome: res.outcome,
    slotType: currentGame,
  });
}

// ── GAME-SPECIFIC SOUNDS ──────────────────────────────────────
function playGameSound(type) {
  const config = GAME_CONFIGS[currentGame];
  const soundTheme = config.soundTheme;
  
  switch(type) {
    case 'spin':
      switch(soundTheme) {
        case 'classic': soundClassicSpin(); break;
        case 'fruit': soundFruitSpin(); break;
        case 'luxury': soundDiamondSpin(); break;
        case 'western': soundWesternSpin(); break;
        default: soundSpinTick();
      }
      break;
      
    case 'win':
      soundWin();
      break;
      
    case 'jackpot':
      soundJackpot();
      break;
      
    case 'lose':
      soundLose();
      break;
  }
}

function setResult(msg, cls) {
  const el = document.getElementById('result');
  el.textContent = msg;
  el.className = 'result-banner ' + cls;
}

function addHistory(reels, win, jackpot, bet, gain) {
  const list = document.getElementById('historyList');
  const item = document.createElement('div');
  item.className = 'history-item ' + (jackpot ? 'jackpot' : win ? 'win' : 'lose');
  item.innerHTML = `<span>${reels.join(' ')}</span><span class="h-amt">${win ? '+' : '−'}$${win ? gain : bet}</span>`;
  list.prepend(item);
  if (list.children.length > 8) list.lastChild.remove();
}

function spawnParticles(count) {
  const emojis = ['💎', '⭐', '🎉', '✨', '💰', '🎊'];
  const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = Math.random() * Math.PI * 2, dist = 100 + Math.random() * 200;
    p.style.cssText = `left:${cx}px;top:${cy}px;--tx:${Math.cos(angle) * dist}px;--ty:${Math.sin(angle) * dist}px;`;
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1100);
  }
}
