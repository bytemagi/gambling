// sounds.js — Web Audio API sound effects, no external files needed

const _ac = new (window.AudioContext || window.webkitAudioContext)();

function _resume() { if (_ac.state === 'suspended') _ac.resume(); }

function _play(fn) {
  try { _resume(); fn(_ac); } catch(e) {}
}

// ── Coin flip whoosh + land ───────────────────────────────────
function soundCoinFlip() {
  _play(ac => {
    const buf = ac.createBuffer(1, ac.sampleRate * 0.3, ac.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/d.length, 2);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 800;
    src.connect(f); f.connect(ac.destination);
    src.start();
  });
}

// ── Win chime ─────────────────────────────────────────────────
function soundWin() {
  _play(ac => {
    [523, 659, 784, 1047].forEach((freq, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, ac.currentTime + i*0.1);
      g.gain.linearRampToValueAtTime(0.18, ac.currentTime + i*0.1 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i*0.1 + 0.4);
      o.connect(g); g.connect(ac.destination);
      o.start(ac.currentTime + i*0.1);
      o.stop(ac.currentTime + i*0.1 + 0.4);
    });
  });
}

// ── Jackpot fanfare ───────────────────────────────────────────
function soundJackpot() {
  _play(ac => {
    [523,659,784,1047,1319,1568].forEach((freq, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'square'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, ac.currentTime + i*0.08);
      g.gain.linearRampToValueAtTime(0.12, ac.currentTime + i*0.08 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i*0.08 + 0.5);
      o.connect(g); g.connect(ac.destination);
      o.start(ac.currentTime + i*0.08);
      o.stop(ac.currentTime + i*0.08 + 0.5);
    });
  });
}

// ── Lose thud ─────────────────────────────────────────────────
function soundLose() {
  _play(ac => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(180, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(40, ac.currentTime + 0.3);
    g.gain.setValueAtTime(0.25, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.3);
  });
}

// ── Click tick ────────────────────────────────────────────────
function soundClick() {
  _play(ac => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine'; o.frequency.value = 1200;
    g.gain.setValueAtTime(0.08, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.05);
  });
}

// ── Reel spin tick ────────────────────────────────────────────
function soundSpinTick() {
  _play(ac => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine'; o.frequency.value = 400 + Math.random()*200;
    g.gain.setValueAtTime(0.06, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.04);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.04);
  });
}

// ── Crash rocket ─────────────────────────────────────────────
function soundCrashRocket() {
  _play(ac => {
    const buf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * 0.15;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 200;
    f.frequency.linearRampToValueAtTime(800, ac.currentTime + 0.5);
    src.connect(f); f.connect(ac.destination);
    src.start();
  });
}

// ── Crash explosion ───────────────────────────────────────────
function soundCrashBoom() {
  _play(ac => {
    const buf = ac.createBuffer(1, ac.sampleRate * 0.6, ac.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/d.length, 0.5);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 300;
    src.connect(f); f.connect(ac.destination);
    src.start();
  });
}

// ── Mine reveal ───────────────────────────────────────────────
function soundMineReveal() {
  _play(ac => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine'; o.frequency.value = 600;
    o.frequency.linearRampToValueAtTime(900, ac.currentTime + 0.08);
    g.gain.setValueAtTime(0.1, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.12);
  });
}

// ── Mine explosion ────────────────────────────────────────────
function soundMineExplode() {
  _play(ac => {
    const buf = ac.createBuffer(1, ac.sampleRate * 0.4, ac.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/d.length, 0.8) * 0.4;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 400;
    src.connect(f); f.connect(ac.destination);
    src.start();
  });
}

// ── Slot game sound themes ────────────────────────────────────

// Classic slots sound (traditional mechanical)
function soundClassicSpin() {
  _play(ac => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'square'; o.frequency.value = 200;
    g.gain.setValueAtTime(0.08, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.1);
  });
}

// Fruit slots sound (playful, bouncy)
function soundFruitSpin() {
  _play(ac => {
    [400, 600, 800].forEach((freq, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, ac.currentTime + i*0.05);
      g.gain.linearRampToValueAtTime(0.1, ac.currentTime + i*0.05 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i*0.05 + 0.15);
      o.connect(g); g.connect(ac.destination);
      o.start(ac.currentTime + i*0.05);
      o.stop(ac.currentTime + i*0.05 + 0.15);
    });
  });
}

// Diamond slots sound (luxurious, shimmering)
function soundDiamondSpin() {
  _play(ac => {
    [800, 1200, 1600, 2000].forEach((freq, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, ac.currentTime + i*0.06);
      g.gain.linearRampToValueAtTime(0.06, ac.currentTime + i*0.06 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i*0.06 + 0.3);
      o.connect(g); g.connect(ac.destination);
      o.start(ac.currentTime + i*0.06);
      o.stop(ac.currentTime + i*0.06 + 0.3);
    });
  });
}

// Wild West slots sound (twangy guitar-like)
function soundWesternSpin() {
  _play(ac => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sawtooth'; o.frequency.value = 150;
    o.frequency.linearRampToValueAtTime(300, ac.currentTime + 0.15);
    g.gain.setValueAtTime(0.12, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.2);
  });
}

// Bonus activation sound (exciting chime)
function soundBonusActivate() {
  _play(ac => {
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, ac.currentTime + i*0.07);
      g.gain.linearRampToValueAtTime(0.15, ac.currentTime + i*0.07 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i*0.07 + 0.5);
      o.connect(g); g.connect(ac.destination);
      o.start(ac.currentTime + i*0.07);
      o.stop(ac.currentTime + i*0.07 + 0.5);
    });
  });
}

// Free spins awarded sound
function soundFreeSpins() {
  _play(ac => {
    [400, 500, 600, 700, 800].forEach((freq, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, ac.currentTime + i*0.08);
      g.gain.linearRampToValueAtTime(0.12, ac.currentTime + i*0.08 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i*0.08 + 0.4);
      o.connect(g); g.connect(ac.destination);
      o.start(ac.currentTime + i*0.08);
      o.stop(ac.currentTime + i*0.08 + 0.4);
    });
  });
}

// Multiplier increase sound
function soundMultiplier() {
  _play(ac => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(400, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(1200, ac.currentTime + 0.3);
    g.gain.setValueAtTime(0.1, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.3);
  });
}

// Wild substitution sound
function soundWildSubstitute() {
  _play(ac => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine'; o.frequency.value = 600;
    o.frequency.linearRampToValueAtTime(900, ac.currentTime + 0.1);
    g.gain.setValueAtTime(0.1, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.15);
  });
}

// ── Fish Frenzy Sounds ─────────────────────────────────────────
function soundShoot() {
  _play(ac => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'square'; o.frequency.value = 400;
    o.frequency.exponentialRampToValueAtTime(800, ac.currentTime + 0.05);
    g.gain.setValueAtTime(0.1, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.1);
  });
}

function soundHit() {
  _play(ac => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine'; o.frequency.value = 800;
    o.frequency.linearRampToValueAtTime(1200, ac.currentTime + 0.05);
    g.gain.setValueAtTime(0.08, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.1);
  });
}

function soundCatch() {
  _play(ac => {
    [600, 800, 1000, 1200].forEach((freq, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, ac.currentTime + i*0.03);
      g.gain.linearRampToValueAtTime(0.1, ac.currentTime + i*0.03 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i*0.03 + 0.2);
      o.connect(g); g.connect(ac.destination);
      o.start(ac.currentTime + i*0.03);
      o.stop(ac.currentTime + i*0.03 + 0.2);
    });
  });
}

function soundBigWin() {
  _play(ac => {
    [523, 659, 784, 1047, 1319, 1568, 2093].forEach((freq, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'square'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, ac.currentTime + i*0.06);
      g.gain.linearRampToValueAtTime(0.15, ac.currentTime + i*0.06 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i*0.06 + 0.6);
      o.connect(g); g.connect(ac.destination);
      o.start(ac.currentTime + i*0.06);
      o.stop(ac.currentTime + i*0.06 + 0.6);
    });
  });
}

function soundBoss() {
  _play(ac => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sawtooth'; o.frequency.value = 80;
    o.frequency.exponentialRampToValueAtTime(40, ac.currentTime + 1);
    g.gain.setValueAtTime(0.2, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 1);
  });
}

function soundCharge() {
  _play(ac => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(200, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(1000, ac.currentTime + 0.5);
    g.gain.setValueAtTime(0, ac.currentTime);
    g.gain.linearRampToValueAtTime(0.15, ac.currentTime + 0.4);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.6);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.6);
  });
}

function soundFreeze() {
  _play(ac => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine'; o.frequency.value = 1200;
    o.frequency.exponentialRampToValueAtTime(400, ac.currentTime + 0.5);
    g.gain.setValueAtTime(0.1, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.5);
  });
}

function soundUpgrade() {
  _play(ac => {
    [400, 500, 600, 800, 1000, 1200].forEach((freq, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, ac.currentTime + i*0.04);
      g.gain.linearRampToValueAtTime(0.12, ac.currentTime + i*0.04 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i*0.04 + 0.3);
      o.connect(g); g.connect(ac.destination);
      o.start(ac.currentTime + i*0.04);
      o.stop(ac.currentTime + i*0.04 + 0.3);
    });
  });
}

function soundLock() {
  _play(ac => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine'; o.frequency.value = 600;
    o.frequency.linearRampToValueAtTime(900, ac.currentTime + 0.08);
    g.gain.setValueAtTime(0.1, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.12);
  });
}

function soundMiss() {
  _play(ac => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine'; o.frequency.value = 200;
    o.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.2);
    g.gain.setValueAtTime(0.08, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.2);
  });
}

function soundBossPhase() {
  _play(ac => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sawtooth'; o.frequency.value = 120;
    o.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.5);
    g.gain.setValueAtTime(0.15, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.5);
  });
}

// ── Global playSound wrapper ───────────────────────────────────
const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';

function playSound(name) {
  if (!soundEnabled) return;
  const fn = window[name];
  if (typeof fn === 'function') {
    try { fn(); } catch(e) {}
  }
}

// Export fish sounds
window.soundShoot = soundShoot;
window.soundHit = soundHit;
window.soundCatch = soundCatch;
window.soundBigWin = soundBigWin;
window.soundBoss = soundBoss;
window.soundCharge = soundCharge;
window.soundFreeze = soundFreeze;
window.soundUpgrade = soundUpgrade;
window.soundLock = soundLock;
window.soundMiss = soundMiss;
window.soundBossPhase = soundBossPhase;

// Export wrapper
window.playSound = playSound;
