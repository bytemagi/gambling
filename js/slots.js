guardPage();
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
  }
};

let currentGame = 'classic';
let useFreeSpin = false;

function updateFreeSpinDisplay() {
  const countEl = document.getElementById('freeSpinCount');
  const buttonEl = document.getElementById('btnFreeSpin');
  const available = Number(window.currentFreeSpins || 0);
  if (countEl) countEl.textContent = String(available);
  if (buttonEl) {
    buttonEl.disabled = available <= 0;
    buttonEl.textContent = useFreeSpin ? 'Using Free Spin' : 'Use Free Spin';
    buttonEl.style.opacity = available <= 0 ? '0.6' : '1';
  }
}

function toggleFreeSpin() {
  const available = Number(window.currentFreeSpins || 0);
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

function setQuickBet(n) {
  const b = currentBalance || n;
  document.getElementById('betAmt').value = Math.min(n, b);
}
function halfBet() {
  const el = document.getElementById('betAmt');
  el.value = Math.max(1, Math.floor(parseInt(el.value || 1) / 2));
}
function doubleBet() {
  const b = currentBalance || 99999;
  const el = document.getElementById('betAmt');
  el.value = Math.min(parseInt(el.value || 1) * 2, b);
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
    window.currentFreeSpins = Number(res.freeSpinsRemaining);
  } else if (useFreeSpin && Number(window.currentFreeSpins || 0) > 0) {
    window.currentFreeSpins = Math.max(0, Number(window.currentFreeSpins || 0) - 1);
  }
  updateFreeSpinDisplay();
  updateBal(res.balance);

  const gain = Math.abs(res.delta);
  const multiplier = res.delta / amount;
  
  // Check for bonuses
  const bonusActivated = checkBonuses(res.outcome, config);
  
  // Determine win type based on game-specific payouts
  const isJackpot = multiplier >= 10;
  const isBigWin = multiplier >= 5 && !isJackpot;

  if (res.win && isJackpot) {
    playGameSound('jackpot');
    const jackpotLabel = multiplier >= 20 ? '💎 MEGA JACKPOT' : '7️⃣ JACKPOT';
    let resultMsg = jackpotLabel + '! YOU WIN $' + gain + '!';
    if (bonusActivated) resultMsg += ' 🎁 BONUS!';
    setResult(resultMsg, 'jackpot-win');
    [1, 2, 3].forEach(n => document.getElementById('rw' + n).classList.add('jackpot'));
    setTimeout(() => [1, 2, 3].forEach(n => document.getElementById('rw' + n).classList.remove('jackpot')), 2000);
    spawnParticles(30);
  } else if (res.win && isBigWin) {
    playGameSound('win');
    let resultMsg = '🎉 THREE OF A KIND — YOU WIN $' + gain + '!';
    if (bonusActivated) resultMsg += ' 🎁 BONUS!';
    setResult(resultMsg, 'win');
    spawnParticles(12);
  } else if (res.win) {
    playGameSound('win');
    let resultMsg = '✨ YOU WIN $' + gain + '!';
    if (bonusActivated) resultMsg += ' 🎁 BONUS!';
    setResult(resultMsg, 'win');
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
    outcome: res.outcome
  });
}

function checkBonuses(outcome, config) {
  // Check if any bonus features are activated
  if (!config.bonusFeatures || config.bonusFeatures.length === 0) return false;
  
  const bonuses = [];
  const gameType = currentGame;
  
  // Check each bonus feature
  config.bonusFeatures.forEach(feature => {
    switch(feature) {
      case 'progressive-jackpot':
        // Classic 7s: Progressive jackpot increases with each spin
        if (outcome[0] === '7️⃣' && outcome[1] === '7️⃣' && outcome[2] === '7️⃣') {
          bonuses.push({ type: 'progressive-jackpot', multiplier: 2 });
        }
        break;
        
      case 'free-spins':
        // Fruit Fiesta: 3+ of any fruit awards free spins
        const fruitSymbols = ['🍒','🍋','🍊','🍉','🍇','🍌'];
        if (fruitSymbols.includes(outcome[0]) && 
            fruitSymbols.includes(outcome[1]) && 
            fruitSymbols.includes(outcome[2])) {
          bonuses.push({ type: 'free-spins', count: 5 });
        }
        break;
        
      case 'multiplier':
        // Fruit Fiesta: Random multiplier 2x-5x on wins
        if (outcome[0] === outcome[1] && outcome[1] === outcome[2]) {
          const mult = Math.floor(Math.random() * 4) + 2; // 2-5x
          bonuses.push({ type: 'multiplier', value: mult });
        }
        break;
        
      case 'mega-multiplier':
        // Diamond Rush: Up to 10x multiplier on diamond wins
        if (outcome[0] === '💎' && outcome[1] === '💎' && outcome[2] === '💎') {
          const mult = Math.floor(Math.random() * 9) + 2; // 2-10x
          bonuses.push({ type: 'mega-multiplier', value: mult });
        }
        break;
        
      case 'bonus-round':
        // Diamond Rush: 3 stars triggers bonus round
        if (outcome[0] === '⭐' && outcome[1] === '⭐' && outcome[2] === '⭐') {
          bonuses.push({ type: 'bonus-round', guaranteedWin: true });
        }
        break;
        
      case 'wild-substitution':
        // Wild West: 🤠 acts as wild (simplified - any 2 matching + 🤠 = win)
        if (outcome.includes('🤠')) {
          bonuses.push({ type: 'wild-substitution', message: '🤠 Wild Substitution!' });
        }
        break;
        
      case 'bounty-bonus':
        // Wild West: 3 money bags = bounty bonus
        if (outcome[0] === '💰' && outcome[1] === '💰' && outcome[2] === '💰') {
          bonuses.push({ type: 'bounty-bonus', multiplier: 3 });
        }
        break;
    }
  });
  
  // Apply bonuses and play sounds
  if (bonuses.length > 0) {
    applyBonuses(bonuses, config);
    return true;
  }
  
  return false;
}

function applyBonuses(bonuses, config) {
  let bonusMessage = '🎁 BONUS ACTIVATED: ';
  const sounds = [];
  
  bonuses.forEach(bonus => {
    switch(bonus.type) {
      case 'progressive-jackpot':
        bonusMessage += 'Progressive Jackpot ×2! ';
        sounds.push('soundJackpot');
        break;
        
      case 'free-spins':
        bonusMessage += `${bonus.count} Free Spins! `;
        sounds.push('soundFreeSpins');
        break;
        
      case 'multiplier':
      case 'mega-multiplier':
        bonusMessage += `${bonus.value}× Multiplier! `;
        sounds.push('soundMultiplier');
        break;
        
      case 'bonus-round':
        bonusMessage += 'BONUS ROUND! Guaranteed Win! ';
        sounds.push('soundBonusActivate');
        break;
        
      case 'wild-substitution':
        bonusMessage += 'Wild Substitution! ';
        sounds.push('soundWildSubstitute');
        break;
        
      case 'bounty-bonus':
        bonusMessage += `Bounty Bonus ×${bonus.multiplier}! `;
        sounds.push('soundBountyBonus');
        break;
    }
  });
  
  // Play all bonus sounds
  sounds.forEach(soundName => {
    if (window[soundName]) {
      setTimeout(() => window[soundName](), sounds.indexOf(soundName) * 200);
    }
  });
  
  // Show bonus message
  const resultEl = document.getElementById('result');
  const currentMsg = resultEl.textContent;
  resultEl.textContent = currentMsg + ' | ' + bonusMessage;
  
  // Spawn extra particles for bonuses
  spawnParticles(15);
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
