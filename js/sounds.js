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
