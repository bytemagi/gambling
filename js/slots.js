guardPage();
renderPFWidget('pfWidget', { serverSeedHash: '—', clientSeed: getClientSeed(), nonce: getNonce() });

const SYMBOLS = ['🍒','🍋','🍊','⭐','💎','7️⃣'];

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
  const count = 14;
  let html = '';
  for (let i = 0; i < count; i++) html += `<div class="reel-symbol">${SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]}</div>`;
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

  const [res] = await Promise.all([
    apiPlaceBet('slots', amount, null),
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

  updateBal(res.balance);

  const gain = Math.abs(res.delta);

  // Jackpot = 7s (10×) or Diamonds (20×); 5× wins (⭐,🍒) are regular big wins
  const isJackpot = res.delta >= amount * 10;

  if (res.win && isJackpot) {
    soundJackpot();
    const jackpotLabel = res.delta >= amount * 20 ? '💎 MEGA JACKPOT' : '7️⃣ JACKPOT';
    setResult(jackpotLabel + '! YOU WIN $' + gain + '!', 'jackpot-win');
    [1, 2, 3].forEach(n => document.getElementById('rw' + n).classList.add('jackpot'));
    setTimeout(() => [1, 2, 3].forEach(n => document.getElementById('rw' + n).classList.remove('jackpot')), 2000);
    spawnParticles(30);
  } else if (res.win) {
    soundWin();
    setResult('🎉 THREE OF A KIND — YOU WIN $' + gain + '!', 'win');
    spawnParticles(12);
  } else if (res.delta === 0) {
    // Fix #6 — pair is a push (break-even), not a win
    setResult('🤝 TWO OF A KIND — BET RETURNED', 'idle');
  } else {
    soundLose();
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
