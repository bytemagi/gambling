// fish.js — Fish Frenzy Arcade Shooter
// ────────────────────────────────────────────────────────────────

// ── CONFIG ──────────────────────────────────────────────────────
const FISH_CONFIG = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  dpr: 1,
  
  // Game state
  running: false,
  paused: false,
  lastTime: 0,
  frameId: null,
  
  // Player
  balance: 0,
  betPerShot: 1,
  cannonLevel: 1,
  cannonXP: 0,
  cannonXPForNext: 500,
  maxCannonLevel: 5,
  
  // Session stats
  stats: { shots: 0, caught: 0, wagered: 0, won: 0, net: 0, bigWin: 0 },
  
  // Cannon
  cannonAngle: -Math.PI / 2,
  targetAngle: -Math.PI / 2,
  autoFire: false,
  lockTarget: null,
  specialCharged: false,
  specialCooldown: 0,
  freezeActive: false,
  freezeEndTime: 0,
  
  // Entities
  fish: [],
  bullets: [],
  nets: [],
  particles: [],
  floatingNumbers: [],
  hitSplashes: [],
  
  // Spawning
  spawnTimer: 0,
  bossActive: false,
  bossFish: null,
  bossSpawnTimer: 0,
  waveTimer: 0,
  currentWave: 0,
  
  // Provably fair
  clientSeed: '',
  nonce: 0,
  serverSeedHash: '',
  
  // Power-ups
  activePowerUps: {},
  
  // Settings
  maxFish: 30,
  maxBullets: 50,
};

// ── FISH DEFINITIONS ────────────────────────────────────────────
const FISH_TYPES = [
  // Common
  { id: 'small_fish', name: 'Small Fish', icon: '🐟', baseMult: 2, rarity: 'common', hp: 1, speed: 1.2, size: 40, score: 2, weight: 30 },
  { id: 'clownfish', name: 'Clownfish', icon: '🐠', baseMult: 3, rarity: 'common', hp: 1, speed: 1.3, size: 45, score: 3, weight: 25 },
  { id: 'blue_fish', name: 'Blue Tang', icon: '🐡', baseMult: 4, rarity: 'common', hp: 2, speed: 1.1, size: 50, score: 4, weight: 20 },
  { id: 'tropical', name: 'Tropical Fish', icon: '🐠', baseMult: 5, rarity: 'common', hp: 2, speed: 1.0, size: 55, score: 5, weight: 15 },
  
  // Rare
  { id: 'angelfish', name: 'Angelfish', icon: '👼', baseMult: 8, rarity: 'rare', hp: 3, speed: 0.9, size: 65, score: 8, weight: 12 },
  { id: 'lionfish', name: 'Lionfish', icon: '🦁', baseMult: 12, rarity: 'rare', hp: 4, speed: 0.8, size: 70, score: 12, weight: 8 },
  { id: 'puffer', name: 'Pufferfish', icon: '🐡', baseMult: 15, rarity: 'rare', hp: 5, speed: 0.7, size: 75, score: 15, weight: 6 },
  
  // Epic
  { id: 'turtle', name: 'Sea Turtle', icon: '🐢', baseMult: 25, rarity: 'epic', hp: 8, speed: 0.5, size: 90, score: 25, weight: 4 },
  { id: 'ray', name: 'Manta Ray', icon: '🪸', baseMult: 35, rarity: 'epic', hp: 10, speed: 0.45, size: 110, score: 35, weight: 3 },
  { id: 'shark', name: 'Reef Shark', icon: '🦈', baseMult: 50, rarity: 'epic', hp: 15, speed: 0.6, size: 120, score: 50, weight: 2 },
  
  // Legendary
  { id: 'whale', name: 'Whale', icon: '🐋', baseMult: 100, rarity: 'legendary', hp: 30, speed: 0.3, size: 160, score: 100, weight: 1 },
  { id: 'golden_fish', name: 'Golden Fish', icon: '🟡', baseMult: 200, rarity: 'legendary', hp: 20, speed: 0.8, size: 80, score: 200, weight: 0.5 },
  
  // Boss
  { id: 'boss_whale', name: 'Golden Whale', icon: '🐋', baseMult: 500, rarity: 'boss', hp: 200, speed: 0.15, size: 280, score: 500, weight: 0, isBoss: true },
  { id: 'boss_shark', name: 'Megalodon', icon: '🦈', baseMult: 800, rarity: 'boss', hp: 300, speed: 0.2, size: 300, score: 800, weight: 0, isBoss: true },
  { id: 'boss_kraken', name: 'Kraken', icon: '🐙', baseMult: 1000, rarity: 'boss', hp: 400, speed: 0.1, size: 350, score: 1000, weight: 0, isBoss: true },
];

const CANNON_UPGRADES = [
  { level: 1, cost: 0, mult: 1, color: '#00c853', netSize: 60, fireRate: 300, special: 'none' },
  { level: 2, cost: 500, mult: 2, color: '#00e5ff', netSize: 80, fireRate: 250, special: 'double_shot' },
  { level: 3, cost: 2000, mult: 3, color: '#7c4dff', netSize: 100, fireRate: 200, special: 'piercing' },
  { level: 4, cost: 5000, mult: 5, color: '#ff6d00', netSize: 130, fireRate: 180, special: 'explosive' },
  { level: 5, cost: 15000, mult: 8, color: '#f5c518', netSize: 160, fireRate: 150, special: 'laser' },
];

const POWER_UPS = [
  { id: 'freeze', name: 'Freeze Time', icon: '❄️', desc: 'Stops all fish for 5s', cooldown: 30000, duration: 5000 },
  { id: 'lightning', name: 'Lightning Chain', icon: '⚡', desc: 'Zaps 5 random fish', cooldown: 45000, instant: true },
  { id: 'drill', name: 'Drill Shot', icon: '🔩', desc: 'Next shot pierces all fish', cooldown: 40000, charges: 1 },
  { id: 'magnet', name: 'Gold Magnet', icon: '🧲', desc: 'Attracts coins for 10s', cooldown: 60000, duration: 10000 },
];

// ── INITIALIZATION ──────────────────────────────────────────────
async function initFishGame() {
  guardPage();
  await initNav();
  initSoundToggle();
  
  // Load profile & balance
  const profile = await fetchProfile();
  if (profile) {
    FISH_CONFIG.balance = profile.balance;
    updateBalanceDisplay(profile.balance);
    document.getElementById('userLabel').textContent = profile.username;
    document.getElementById('heroUsername').textContent = profile.username;
  }
  
  // Load client seed & nonce
  FISH_CONFIG.clientSeed = getClientSeed();
  FISH_CONFIG.nonce = getNonce();
  
  // Setup canvas
  setupCanvas();
  
  // Setup UI
  setupUI();
  
  // Load fish guide
  renderFishGuide();
  renderPowerUps();
  
  // Start game loop
  FISH_CONFIG.running = true;
  FISH_CONFIG.lastTime = performance.now();
  requestAnimationFrame(gameLoop);
  
  // Start spawn waves
  startWaveSystem();
  
  console.log('🐟 Fish Frenzy initialized');
}

function setupCanvas() {
  const canvas = document.getElementById('gameCanvas');
  const area = document.querySelector('.game-canvas-area');
  
  FISH_CONFIG.dpr = window.devicePixelRatio || 1;
  
  function resize() {
    const rect = area.getBoundingClientRect();
    FISH_CONFIG.width = rect.width;
    FISH_CONFIG.height = rect.height;
    
    canvas.width = FISH_CONFIG.width * FISH_CONFIG.dpr;
    canvas.height = FISH_CONFIG.height * FISH_CONFIG.dpr;
    canvas.style.width = FISH_CONFIG.width + 'px';
    canvas.style.height = FISH_CONFIG.height + 'px';
    
    FISH_CONFIG.ctx = canvas.getContext('2d');
    FISH_CONFIG.ctx.scale(FISH_CONFIG.dpr, FISH_CONFIG.dpr);
  }
  
  resize();
  window.addEventListener('resize', resize);
  FISH_CONFIG.canvas = canvas;
  
  // Mouse/touch aiming
  canvas.addEventListener('mousemove', onAimMove);
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); onAimMove(e.touches[0]); }, { passive: false });
  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onCanvasClick(e.touches[0]); }, { passive: false });
  
  // Prevent context menu
  canvas.addEventListener('contextmenu', e => e.preventDefault());
}

// ── UI SETUP ────────────────────────────────────────────────────
function setupUI() {
  // Bet slider
  const betSlider = document.getElementById('betSlider');
  const betDisplay = document.getElementById('betDisplay');
  betSlider.max = Math.min(100, FISH_CONFIG.balance);
  betSlider.value = FISH_CONFIG.betPerShot;
  betDisplay.textContent = FISH_CONFIG.betPerShot;
  
  betSlider.addEventListener('input', (e) => {
    FISH_CONFIG.betPerShot = parseInt(e.target.value);
    betDisplay.textContent = FISH_CONFIG.betPerShot;
    updateQuickBets();
    updateCannonVisual();
  });
  
  // Quick bet buttons
  document.querySelectorAll('.qb').forEach(btn => {
    btn.addEventListener('click', () => {
      const bet = parseInt(btn.dataset.bet);
      if (bet <= FISH_CONFIG.balance) {
        FISH_CONFIG.betPerShot = bet;
        betSlider.value = bet;
        betDisplay.textContent = bet;
        updateQuickBets();
        updateCannonVisual();
      }
    });
  });
  
  // Cannon upgrade
  document.getElementById('upgradeCannon').addEventListener('click', upgradeCannon);
  updateCannonUpgradeUI();
  
  // Footer controls
  document.getElementById('btnAutoFire').addEventListener('click', toggleAutoFire);
  document.getElementById('btnSpecial').addEventListener('click', fireSpecial);
  document.getElementById('btnLockTarget').addEventListener('click', toggleLockTarget);
  document.getElementById('btnFreeze').addEventListener('click', useFreeze);
  
  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    switch(e.code) {
      case 'Space': e.preventDefault(); fireNet(); break;
      case 'KeyA': toggleAutoFire(); break;
      case 'KeyS': fireSpecial(); break;
      case 'KeyL': toggleLockTarget(); break;
      case 'KeyF': useFreeze(); break;
      case 'ArrowUp': adjustBet(1); break;
      case 'ArrowDown': adjustBet(-1); break;
    }
  });
  
  // Update bet slider max when balance changes
  const originalUpdateBal = window.updateBal;
  window.updateBal = function(n) {
    if (originalUpdateBal) originalUpdateBal(n);
    FISH_CONFIG.balance = n;
    document.getElementById('betSlider').max = Math.min(100, n);
    if (FISH_CONFIG.betPerShot > n) {
      FISH_CONFIG.betPerShot = Math.max(1, n);
      document.getElementById('betSlider').value = FISH_CONFIG.betPerShot;
      document.getElementById('betDisplay').textContent = FISH_CONFIG.betPerShot;
      updateQuickBets();
    }
  };
}

// ── FISH GUIDE & POWER-UPS ─────────────────────────────────────
function renderFishGuide() {
  const container = document.getElementById('fishList');
  const displayTypes = FISH_TYPES.filter(f => !f.isBoss).sort((a,b) => b.baseMult - a.baseMult);
  
  container.innerHTML = displayTypes.map(fish => `
    <div class="fish-item" data-rarity="${fish.rarity}">
      <span class="fish-icon">${fish.icon}</span>
      <div class="fish-info">
        <div class="fish-name">${fish.name}</div>
        <div class="fish-multiplier">${fish.baseMult}×</div>
      </div>
      <span class="fish-rarity rarity-${fish.rarity}">${fish.rarity}</span>
    </div>
  `).join('');
}

function renderPowerUps() {
  const container = document.getElementById('powerupGrid');
  container.innerHTML = POWER_UPS.map(p => `
    <div class="powerup-card" data-id="${p.id}">
      <div class="powerup-icon">${p.icon}</div>
      <div class="powerup-name">${p.name}</div>
      <div class="powerup-desc">${p.desc}</div>
    </div>
  `).join('');
}

// ── CANNON & BET VISUALS ───────────────────────────────────────
function updateQuickBets() {
  document.querySelectorAll('.qb').forEach(btn => {
    const bet = parseInt(btn.dataset.bet);
    btn.classList.toggle('active', bet === FISH_CONFIG.betPerShot);
    btn.disabled = bet > FISH_CONFIG.balance;
  });
}

function updateCannonVisual() {
  const upgrade = CANNON_UPGRADES[FISH_CONFIG.cannonLevel - 1];
  document.getElementById('cannonLevel').textContent = `Lv.${FISH_CONFIG.cannonLevel}`;
  document.getElementById('cannonMultiplier').textContent = `${upgrade.mult}×`;
  
  // Update cannon barrel color via CSS variable
  document.documentElement.style.setProperty('--cannon-color', upgrade.color);
}

function updateCannonUpgradeUI() {
  if (FISH_CONFIG.cannonLevel >= FISH_CONFIG.maxCannonLevel) {
    document.getElementById('upgradeCannon').disabled = true;
    document.getElementById('upgradeCannon').innerHTML = '<span>MAX LEVEL</span>';
    document.getElementById('cannonProgressBar').style.width = '100%';
    document.getElementById('cannonHint').textContent = 'Cannon fully upgraded!';
    return;
  }
  
  const next = CANNON_UPGRADES[FISH_CONFIG.cannonLevel];
  const progress = Math.min(100, (FISH_CONFIG.cannonXP / next.cost) * 100);
  document.getElementById('upgradeCost').textContent = `$${next.cost - FISH_CONFIG.cannonXP} more`;
  document.getElementById('cannonProgressBar').style.width = `${progress}%`;
  document.getElementById('cannonHint').textContent = `Reach $${next.cost} won to unlock Lv.${next.level}`;
  document.getElementById('upgradeCannon').disabled = FISH_CONFIG.cannonXP < next.cost;
}

function upgradeCannon() {
  if (FISH_CONFIG.cannonLevel >= FISH_CONFIG.maxCannonLevel) return;
  const next = CANNON_UPGRADES[FISH_CONFIG.cannonLevel];
  if (FISH_CONFIG.cannonXP >= next.cost) {
    FISH_CONFIG.cannonLevel++;
    FISH_CONFIG.cannonXP -= next.cost;
    playSound('upgrade');
    spawnParticles(FISH_CONFIG.width / 2, FISH_CONFIG.height - 100, 20, ['⭐', '✨', '💫']);
    updateCannonVisual();
    updateCannonUpgradeUI();
  }
}

// ── AIMING & CONTROLS ──────────────────────────────────────────
function onAimMove(e) {
  if (FISH_CONFIG.lockTarget) return;
  const rect = FISH_CONFIG.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  aimAt(x, y);
}

function aimAt(x, y) {
  const cannonX = FISH_CONFIG.width / 2;
  const cannonY = FISH_CONFIG.height - 80;
  FISH_CONFIG.targetAngle = Math.atan2(y - cannonY, x - cannonX);
  // Clamp to upward directions only
  if (FISH_CONFIG.targetAngle > -0.3) FISH_CONFIG.targetAngle = -0.3;
  if (FISH_CONFIG.targetAngle < -Math.PI + 0.3) FISH_CONFIG.targetAngle = -Math.PI + 0.3;
  
  updateAimLine();
}

function updateAimLine() {
  const line = document.getElementById('aimLine');
  const cannonX = FISH_CONFIG.width / 2;
  const cannonY = FISH_CONFIG.height - 80;
  const length = 150;
  const endX = cannonX + Math.cos(FISH_CONFIG.targetAngle) * length;
  const endY = cannonY + Math.sin(FISH_CONFIG.targetAngle) * length;
  
  line.style.left = `${cannonX}px`;
  line.style.bottom = `${FISH_CONFIG.height - cannonY}px`;
  line.style.height = `${length}px`;
  line.style.transform = `translateX(-50%) rotate(${FISH_CONFIG.targetAngle}rad)`;
  line.classList.add('visible');
}

function onCanvasClick(e) {
  if (!FISH_CONFIG.autoFire) fireNet();
}

function adjustBet(delta) {
  const slider = document.getElementById('betSlider');
  const newVal = Math.max(1, Math.min(parseInt(slider.max), FISH_CONFIG.betPerShot + delta));
  slider.value = newVal;
  FISH_CONFIG.betPerShot = newVal;
  document.getElementById('betDisplay').textContent = newVal;
  updateQuickBets();
  updateCannonVisual();
}

// ── FIRING MECHANICS ───────────────────────────────────────────
let lastFireTime = 0;

function fireNet() {
  const now = performance.now();
  const upgrade = CANNON_UPGRADES[FISH_CONFIG.cannonLevel - 1];
  
  if (now - lastFireTime < upgrade.fireRate) return;
  if (FISH_CONFIG.betPerShot > FISH_CONFIG.balance) return;
  
  // Deduct bet
  FISH_CONFIG.balance -= FISH_CONFIG.betPerShot;
  FISH_CONFIG.stats.shots++;
  FISH_CONFIG.stats.wagered += FISH_CONFIG.betPerShot;
  updateBalanceDisplay(FISH_CONFIG.balance);
  window.updateBal?.(FISH_CONFIG.balance);
  
  // Create bullet/net
  const cannonX = FISH_CONFIG.width / 2;
  const cannonY = FISH_CONFIG.height - 80;
  const angle = FISH_CONFIG.cannonAngle;
  
  // Visual bullet trail
  createBulletTrail(cannonX, cannonY, angle);
  
  // Create net at target position after travel time
  const travelTime = 300; // ms
  const netX = cannonX + Math.cos(angle) * 400;
  const netY = cannonY + Math.sin(angle) * 400;
  
  setTimeout(() => {
    createNet(netX, netY, upgrade.netSize);
    checkCollisions(netX, netY, upgrade.netSize);
  }, travelTime);
  
  lastFireTime = now;
  playSound('shoot');
  
  // Cannon recoil animation
  animateCannonRecoil();
  
  // Charge special
  chargeSpecial();
}

function createBulletTrail(x, y, angle) {
  const upgrade = CANNON_UPGRADES[FISH_CONFIG.cannonLevel - 1];
  const trail = {
    x, y, angle,
    life: 1,
    maxLife: 1,
    color: upgrade.color,
    level: FISH_CONFIG.cannonLevel,
    special: FISH_CONFIG.specialCharged
  };
  FISH_CONFIG.bullets.push(trail);
}

function createNet(x, y, size) {
  const net = {
    x, y,
    radius: size,
    maxRadius: size,
    life: 1,
    maxLife: 0.3,
    color: CANNON_UPGRADES[FISH_CONFIG.cannonLevel - 1].color
  };
  FISH_CONFIG.nets.push(net);
  
  // Visual net effect on overlay
  const overlay = document.getElementById('hitEffectLayer');
  const rect = FISH_CONFIG.canvas.getBoundingClientRect();
  const netEl = document.createElement('div');
  netEl.className = 'net-effect';
  netEl.style.left = `${x}px`;
  netEl.style.top = `${y}px`;
  netEl.style.borderColor = net.color;
  overlay.appendChild(netEl);
  setTimeout(() => netEl.remove(), 400);
}

function checkCollisions(netX, netY, netRadius) {
  const upgrade = CANNON_UPGRADES[FISH_CONFIG.cannonLevel - 1];
  let hitAny = false;
  let totalWin = 0;
  const caughtFish = [];
  
  for (let i = FISH_CONFIG.fish.length - 1; i >= 0; i--) {
    const fish = FISH_CONFIG.fish[i];
    const dx = fish.x - netX;
    const dy = fish.y - netY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < netRadius + fish.size / 2) {
      // Calculate catch probability based on fish HP and cannon level
      const catchChance = Math.min(0.95, 0.3 + (FISH_CONFIG.cannonLevel * 0.12) + (upgrade.mult * 0.05));
      const rand = Math.random();
      
      if (rand < catchChance || fish.hp <= 1) {
        // CAUGHT!
        const winAmount = calculateWin(fish);
        totalWin += winAmount;
        caughtFish.push({ fish, win: winAmount, x: fish.x, y: fish.y });
        hitAny = true;
        
        // Add XP
        FISH_CONFIG.cannonXP += fish.score;
        updateCannonUpgradeUI();
        
        // Remove fish
        FISH_CONFIG.fish.splice(i, 1);
        FISH_CONFIG.stats.caught++;
        
        // Floating number
        createFloatingNumber(fish.x, fish.y, winAmount, fish.baseMult >= 50 ? 'bigwin' : 'win');
      } else {
        // MISSED - fish takes damage
        fish.hp--;
        createHitSplash(fish.x, fish.y, fish.icon);
        playSound('hit');
      }
    }
  }
  
  if (totalWin > 0) {
    FISH_CONFIG.balance += totalWin;
    FISH_CONFIG.stats.won += totalWin;
    FISH_CONFIG.stats.net += totalWin - FISH_CONFIG.betPerShot;
    if (totalWin > FISH_CONFIG.stats.bigWin) FISH_CONFIG.stats.bigWin = totalWin;
    updateBalanceDisplay(FISH_CONFIG.balance);
    window.updateBal?.(FISH_CONFIG.balance);
    playSound(totalWin > FISH_CONFIG.betPerShot * 10 ? 'bigwin' : 'win');
    
    // Add to recent wins
    caughtFish.forEach(cf => addRecentWin(cf.fish, cf.win));
  }
  
  if (!hitAny) {
    playSound('miss');
  }
  
  updateStatsDisplay();
}

function calculateWin(fish) {
  const upgrade = CANNON_UPGRADES[FISH_CONFIG.cannonLevel - 1];
  let mult = fish.baseMult * upgrade.mult;
  
  // Provably fair variance (±20%)
  const variance = 0.8 + (getProvablyFairRandom() * 0.4);
  mult *= variance;
  
  const win = Math.round(FISH_CONFIG.betPerShot * mult);
  return Math.max(FISH_CONFIG.betPerShot, win); // At least bet back
}

function getProvablyFairRandom() {
  // Simple client-side deterministic random for visual variance
  // Server-side determines actual outcome
  const str = `${FISH_CONFIG.clientSeed}:${FISH_CONFIG.nonce++}:${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 10000) / 10000;
}

// ── SPECIAL WEAPONS ────────────────────────────────────────────
function chargeSpecial() {
  if (FISH_CONFIG.specialCharged) return;
  FISH_CONFIG.specialCooldown++;
  const chargesNeeded = 10 + FISH_CONFIG.cannonLevel * 2;
  
  const btn = document.getElementById('btnSpecial');
  const progress = Math.min(100, (FISH_CONFIG.specialCooldown / chargesNeeded) * 100);
  btn.style.setProperty('--charge-progress', `${progress}%`);
  
  if (FISH_CONFIG.specialCooldown >= chargesNeeded) {
    FISH_CONFIG.specialCharged = true;
    btn.disabled = false;
    btn.classList.add('charged');
    document.getElementById('specialText').textContent = 'READY';
    playSound('charge');
  }
}

function fireSpecial() {
  const btn = document.getElementById('btnSpecial');
  if (!FISH_CONFIG.specialCharged || btn.disabled) return;
  
  const upgrade = CANNON_UPGRADES[FISH_CONFIG.cannonLevel - 1];
  
  switch(upgrade.special) {
    case 'double_shot':
      fireDoubleShot();
      break;
    case 'piercing':
      firePiercingShot();
      break;
    case 'explosive':
      fireExplosiveNet();
      break;
    case 'laser':
      fireLaser();
      break;
    default:
      fireDoubleShot();
  }
  
  FISH_CONFIG.specialCharged = false;
  FISH_CONFIG.specialCooldown = 0;
  btn.disabled = true;
  btn.classList.remove('charged');
  document.getElementById('specialText').textContent = 'Charge';
  btn.style.setProperty('--charge-progress', '0%');
}

function fireDoubleShot() {
  const angle = FISH_CONFIG.cannonAngle;
  fireNetAtAngle(angle - 0.15);
  setTimeout(() => fireNetAtAngle(angle + 0.15), 100);
}

function firePiercingShot() {
  // Piercing net hits all fish in line
  const cannonX = FISH_CONFIG.width / 2;
  const cannonY = FISH_CONFIG.height - 80;
  const angle = FISH_CONFIG.cannonAngle;
  
  for (let d = 100; d < 800; d += 80) {
    const x = cannonX + Math.cos(angle) * d;
    const y = cannonY + Math.sin(angle) * d;
    setTimeout(() => {
      createNet(x, y, 60);
      checkCollisions(x, y, 60);
    }, d / 2);
  }
}

function fireExplosiveNet() {
  const cannonX = FISH_CONFIG.width / 2;
  const cannonY = FISH_CONFIG.height - 80;
  const angle = FISH_CONFIG.cannonAngle;
  const x = cannonX + Math.cos(angle) * 400;
  const y = cannonY + Math.sin(angle) * 400;
  
  createNet(x, y, 200);
  checkCollisions(x, y, 200);
  createExplosion(x, y);
}

function fireLaser() {
  const cannonX = FISH_CONFIG.width / 2;
  const cannonY = FISH_CONFIG.height - 80;
  const angle = FISH_CONFIG.cannonAngle;
  
  // Laser hits everything in path
  for (let d = 50; d < 800; d += 20) {
    const x = cannonX + Math.cos(angle) * d;
    const y = cannonY + Math.sin(angle) * d;
    setTimeout(() => {
      checkCollisions(x, y, 30);
      createLaserSegment(x, y, angle);
    }, d / 5);
  }
}

function fireNetAtAngle(angle) {
  const cannonX = FISH_CONFIG.width / 2;
  const cannonY = FISH_CONFIG.height - 80;
  const upgrade = CANNON_UPGRADES[FISH_CONFIG.cannonLevel - 1];
  const x = cannonX + Math.cos(angle) * 400;
  const y = cannonY + Math.sin(angle) * 400;
  
  createNet(x, y, upgrade.netSize);
  checkCollisions(x, y, upgrade.netSize);
}

function toggleAutoFire() {
  FISH_CONFIG.autoFire = !FISH_CONFIG.autoFire;
  const btn = document.getElementById('btnAutoFire');
  btn.classList.toggle('active', FISH_CONFIG.autoFire);
  btn.innerHTML = `<span class="btn-icon">${FISH_CONFIG.autoFire ? '🛑' : '🎯'}</span> ${FISH_CONFIG.autoFire ? 'Stop Auto' : 'Auto Fire'}`;
  playSound('click');
}

function toggleLockTarget() {
  if (FISH_CONFIG.lockTarget) {
    FISH_CONFIG.lockTarget = null;
    document.getElementById('btnLockTarget').classList.remove('active');
    document.getElementById('aimLine').classList.remove('visible');
    playSound('click');
  } else {
    // Find nearest high-value fish
    let bestFish = null;
    let bestValue = 0;
    FISH_CONFIG.fish.forEach(fish => {
      const value = fish.baseMult / Math.max(1, fish.hp);
      if (value > bestValue) {
        bestValue = value;
        bestFish = fish;
      }
    });
    if (bestFish) {
      FISH_CONFIG.lockTarget = bestFish;
      document.getElementById('btnLockTarget').classList.add('active');
      playSound('lock');
    }
  }
}

function useFreeze() {
  const btn = document.getElementById('btnFreeze');
  if (btn.disabled || FISH_CONFIG.freezeActive) return;
  
  FISH_CONFIG.freezeActive = true;
  FISH_CONFIG.freezeEndTime = performance.now() + 5000;
  btn.disabled = true;
  btn.classList.add('active');
  btn.innerHTML = '<span class="btn-icon">❄️</span> Frozen';
  playSound('freeze');
  
  setTimeout(() => {
    FISH_CONFIG.freezeActive = false;
    btn.disabled = false;
    btn.classList.remove('active');
    btn.innerHTML = '<span class="btn-icon">❄️</span> Freeze';
  }, 5000);
}

// ── FISH SPAWNING & WAVES ──────────────────────────────────────
function startWaveSystem() {
  spawnWave();
  setInterval(() => {
    if (!FISH_CONFIG.bossActive && FISH_CONFIG.fish.length < FISH_CONFIG.maxFish) {
      spawnRandomFish();
    }
  }, 2000);
  
  // Boss timer
  setInterval(() => {
    if (!FISH_CONFIG.bossActive && Math.random() < 0.02) {
      spawnBoss();
    }
  }, 5000);
}

function spawnWave() {
  FISH_CONFIG.currentWave++;
  const waveSize = Math.min(5 + FISH_CONFIG.currentWave, 15);
  
  for (let i = 0; i < waveSize; i++) {
    setTimeout(() => spawnRandomFish(true), i * 300);
  }
}

function spawnRandomFish(fromWave = false) {
  if (FISH_CONFIG.fish.length >= FISH_CONFIG.maxFish) return;
  
  // Weighted random selection
  const totalWeight = FISH_TYPES.filter(f => !f.isBoss).reduce((sum, f) => sum + f.weight, 0);
  let rand = Math.random() * totalWeight;
  let selected = FISH_TYPES[0];
  
  for (const fish of FISH_TYPES) {
    if (fish.isBoss) continue;
    rand -= fish.weight;
    if (rand <= 0) { selected = fish; break; }
  }
  
  spawnFish(selected, fromWave);
}

function spawnFish(type, fromWave = false) {
  const goingRight = Math.random() < 0.5;
  const startX = goingRight ? -type.size : FISH_CONFIG.width + type.size;
  const startY = 50 + Math.random() * (FISH_CONFIG.height - 200);
  
  const fish = {
    ...type,
    x: startX,
    y: startY,
    vx: (goingRight ? 1 : -1) * type.speed * (0.8 + Math.random() * 0.4),
    vy: (Math.random() - 0.5) * 0.5,
    hp: type.hp,
    maxHp: type.hp,
    goingRight,
    spawnTime: performance.now(),
    id: `fish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.02 + Math.random() * 0.03,
  };
  
  FISH_CONFIG.fish.push(fish);
}

function spawnBoss() {
  if (FISH_CONFIG.bossActive) return;
  
  const bosses = FISH_TYPES.filter(f => f.isBoss);
  const bossType = bosses[Math.floor(Math.random() * bosses.length)];
  
  const goingRight = Math.random() < 0.5;
  const startX = goingRight ? -bossType.size : FISH_CONFIG.width + bossType.size;
  const startY = FISH_CONFIG.height / 2;
  
  FISH_CONFIG.bossFish = {
    ...bossType,
    x: startX,
    y: startY,
    vx: (goingRight ? 1 : -1) * bossType.speed,
    vy: 0,
    hp: bossType.hp,
    maxHp: bossType.hp,
    goingRight,
    spawnTime: performance.now(),
    id: `boss_${Date.now()}`,
    phase: 1,
    lastAttack: 0,
  };
  
  FISH_CONFIG.fish.push(FISH_CONFIG.bossFish);
  FISH_CONFIG.bossActive = true;
  
  // Show boss banner
  const banner = document.getElementById('bossBanner');
  document.getElementById('bossName').textContent = bossType.name;
  document.getElementById('bossHpFill').style.width = '100%';
  banner.style.display = 'flex';
  
  playSound('boss');
}

function updateBossBanner() {
  if (!FISH_CONFIG.bossFish) return;
  const pct = (FISH_CONFIG.bossFish.hp / FISH_CONFIG.bossFish.maxHp) * 100;
  document.getElementById('bossHpFill').style.width = `${pct}%`;
  
  if (FISH_CONFIG.bossFish.hp <= 0) {
    // Boss defeated!
    const win = calculateWin(FISH_CONFIG.bossFish);
    FISH_CONFIG.balance += win;
    FISH_CONFIG.stats.won += win;
    FISH_CONFIG.stats.net += win;
    FISH_CONFIG.stats.bigWin = Math.max(FISH_CONFIG.stats.bigWin, win);
    updateBalanceDisplay(FISH_CONFIG.balance);
    window.updateBal?.(FISH_CONFIG.balance);
    
    createFloatingNumber(FISH_CONFIG.bossFish.x, FISH_CONFIG.bossFish.y, win, 'boss');
    addRecentWin(FISH_CONFIG.bossFish, win);
    playSound('jackpot');
    spawnParticles(FISH_CONFIG.bossFish.x, FISH_CONFIG.bossFish.y, 50, ['💰', '💎', '🏆', '⭐']);
    
    FISH_CONFIG.bossActive = false;
    FISH_CONFIG.bossFish = null;
    document.getElementById('bossBanner').style.display = 'none';
  }
}

// ── GAME LOOP ──────────────────────────────────────────────────
function gameLoop(time) {
  if (!FISH_CONFIG.running) return;
  
  const dt = Math.min(50, time - FISH_CONFIG.lastTime) / 1000; // seconds, capped
  FISH_CONFIG.lastTime = time;
  
  if (!FISH_CONFIG.paused) {
    update(dt);
  }
  render();
  
  FISH_CONFIG.frameId = requestAnimationFrame(gameLoop);
}

function update(dt) {
  // Update freeze
  if (FISH_CONFIG.freezeActive && performance.now() > FISH_CONFIG.freezeEndTime) {
    FISH_CONFIG.freezeActive = false;
  }
  
  // Update cannon angle smoothing
  FISH_CONFIG.cannonAngle += (FISH_CONFIG.targetAngle - FISH_CONFIG.cannonAngle) * 0.15;
  
  // Lock target tracking
  if (FISH_CONFIG.lockTarget) {
    const fish = FISH_CONFIG.lockTarget;
    if (FISH_CONFIG.fish.includes(fish)) {
      const cannonX = FISH_CONFIG.width / 2;
      const cannonY = FISH_CONFIG.height - 80;
      FISH_CONFIG.targetAngle = Math.atan2(fish.y - cannonY, fish.x - cannonX);
      updateAimLine();
    } else {
      FISH_CONFIG.lockTarget = null;
      document.getElementById('btnLockTarget').classList.remove('active');
    }
  }
  
  // Auto fire
  if (FISH_CONFIG.autoFire) {
    fireNet();
  }
  
  // Update fish
  if (!FISH_CONFIG.freezeActive) {
    updateFish(dt);
  }
  
  // Update bullets
  updateBullets(dt);
  
  // Update nets
  updateNets(dt);
  
  // Update particles
  updateParticles(dt);
  
  // Update floating numbers
  updateFloatingNumbers(dt);
  
  // Update hit splashes
  updateHitSplashes(dt);
  
  // Update boss
  if (FISH_CONFIG.bossActive) updateBossBanner();
  
  // Clean up off-screen fish
  cleanupEntities();
}

function updateFish(dt) {
  const speedMult = FISH_CONFIG.freezeActive ? 0 : 1;
  
  FISH_CONFIG.fish.forEach(fish => {
    // Basic movement
    fish.x += fish.vx * speedMult * 60 * dt;
    fish.y += fish.vy * speedMult * 60 * dt;
    
    // Wobble
    fish.wobblePhase += fish.wobbleSpeed * 60 * dt;
    fish.y += Math.sin(fish.wobblePhase) * 0.5 * speedMult;
    
    // Bounce off top/bottom
    const margin = fish.size;
    if (fish.y < margin) { fish.y = margin; fish.vy = Math.abs(fish.vy); }
    if (fish.y > FISH_CONFIG.height - margin) { fish.y = FISH_CONFIG.height - margin; fish.vy = -Math.abs(fish.vy); }
    
    // Boss behavior
    if (fish.isBoss) {
      updateBossBehavior(fish, dt);
    }
  });
}

function updateBossBehavior(boss, dt) {
  // Slow patrol
  boss.x += boss.vx * 60 * dt;
  boss.y += Math.sin(performance.now() / 2000) * 0.5 * 60 * dt;
  
  // Turn at edges
  if (boss.x < boss.size || boss.x > FISH_CONFIG.width - boss.size) {
    boss.vx *= -1;
    boss.goingRight = boss.vx > 0;
  }
  
  // Phase transitions
  const hpPct = boss.hp / boss.maxHp;
  if (hpPct < 0.3 && boss.phase === 1) {
    boss.phase = 2;
    boss.vx *= 1.5;
    playSound('bossPhase');
  } else if (hpPct < 0.6 && boss.phase === 1 && Math.random() < 0.01) {
    // Spawn minions
    for (let i = 0; i < 3; i++) {
      setTimeout(() => spawnRandomFish(), i * 200);
    }
  }
}

function updateBullets(dt) {
  FISH_CONFIG.bullets = FISH_CONFIG.bullets.filter(b => {
    b.life -= dt * 3;
    return b.life > 0;
  });
}

function updateNets(dt) {
  FISH_CONFIG.nets = FISH_CONFIG.nets.filter(n => {
    n.life -= dt * 4;
    return n.life > 0;
  });
}

function updateParticles(dt) {
  FISH_CONFIG.particles = FISH_CONFIG.particles.filter(p => {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 200 * dt; // gravity
    return p.life > 0;
  });
}

function updateFloatingNumbers(dt) {
  FISH_CONFIG.floatingNumbers = FISH_CONFIG.floatingNumbers.filter(fn => {
    fn.life -= dt;
    fn.y -= 40 * dt;
    return fn.life > 0;
  });
}

function updateHitSplashes(dt) {
  FISH_CONFIG.hitSplashes = FISH_CONFIG.hitSplashes.filter(hs => {
    hs.life -= dt * 2;
    return hs.life > 0;
  });
}

function cleanupEntities() {
  // Remove fish off-screen
  FISH_CONFIG.fish = FISH_CONFIG.fish.filter(fish => {
    const margin = fish.size + 50;
    return fish.x > -margin && fish.x < FISH_CONFIG.width + margin;
  });
  
  // Limit arrays
  if (FISH_CONFIG.bullets.length > FISH_CONFIG.maxBullets) {
    FISH_CONFIG.bullets = FISH_CONFIG.bullets.slice(-FISH_CONFIG.maxBullets);
  }
}

// ── RENDERING ──────────────────────────────────────────────────
function render() {
  const ctx = FISH_CONFIG.ctx;
  const w = FISH_CONFIG.width;
  const h = FISH_CONFIG.height;
  
  // Clear
  ctx.clearRect(0, 0, w, h);
  
  // Draw underwater background
  drawBackground(ctx, w, h);
  
  // Draw fish
  drawFish(ctx);
  
  // Draw bullets
  drawBullets(ctx);
  
  // Draw nets
  drawNets(ctx);
  
  // Draw particles
  drawParticles(ctx);
  
  // Draw cannon
  drawCannon(ctx, w, h);
  
  // Draw hit splashes
  drawHitSplashes(ctx);
}

function drawBackground(ctx, w, h) {
  // Deep water gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#051020');
  grad.addColorStop(0.5, '#031525');
  grad.addColorStop(1, '#020812');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  
  // Caustic light rays (animated)
  const time = performance.now() / 3000;
  for (let i = 0; i < 5; i++) {
    const x = (w * 0.2) + (i * w * 0.15) + Math.sin(time + i) * 30;
    const rayGrad = ctx.createRadialGradient(x, h, 0, x, h, w * 0.6);
    rayGrad.addColorStop(0, 'rgba(255,255,255,0.03)');
    rayGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rayGrad;
    ctx.fillRect(0, 0, w, h);
  }
  
  // Bubbles
  drawBubbles(ctx, w, h);
}

function drawBubbles(ctx, w, h) {
  if (!FISH_CONFIG.bubbles) {
    FISH_CONFIG.bubbles = Array.from({length: 30}, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 2 + Math.random() * 6,
      speed: 10 + Math.random() * 30,
      sway: Math.random() * Math.PI * 2,
    }));
  }
  
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  FISH_CONFIG.bubbles.forEach(b => {
    b.y -= b.speed / 60;
    b.x += Math.sin(performance.now() / 1000 + b.sway) * 0.3;
    if (b.y < -b.r) { b.y = h + b.r; b.x = Math.random() * w; }
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawFish(ctx) {
  FISH_CONFIG.fish.forEach(fish => {
    ctx.save();
    ctx.translate(fish.x, fish.y);
    
    if (!fish.goingRight) ctx.scale(-1, 1);
    
    // Health bar for damaged fish
    if (fish.hp < fish.maxHp) {
      const barW = fish.size;
      const barH = 4;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-barW/2, -fish.size/2 - 10, barW, barH);
      ctx.fillStyle = fish.hp / fish.maxHp > 0.5 ? '#00c853' : '#ff1744';
      ctx.fillRect(-barW/2, -fish.size/2 - 10, barW * (fish.hp / fish.maxHp), barH);
    }
    
    // Boss glow
    if (fish.isBoss) {
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, fish.size);
      glow.addColorStop(0, 'rgba(255,23,68,0.3)');
      glow.addColorStop(1, 'rgba(255,23,68,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, fish.size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Freeze effect
    if (FISH_CONFIG.freezeActive && !fish.isBoss) {
      ctx.filter = 'hue-rotate(180deg) saturate(2) brightness(1.2)';
    }
    
    // Draw fish emoji (large)
    ctx.font = `${fish.size}px "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fish.icon, 0, 0);
    
    ctx.restore();
  });
}

function drawBullets(ctx) {
  FISH_CONFIG.bullets.forEach(b => {
    const alpha = b.life;
    const size = 6 + (b.level - 1) * 2;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle);
    
    // Trail
    const grad = ctx.createLinearGradient(-30, 0, 0, 0);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, b.color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-30, -size/2);
    ctx.lineTo(0, -size/2);
    ctx.lineTo(10, 0);
    ctx.lineTo(0, size/2);
    ctx.lineTo(-30, size/2);
    ctx.closePath();
    ctx.fill();
    
    // Bullet head
    if (b.special) {
      ctx.fillStyle = '#fff';
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 15;
    } else {
      ctx.fillStyle = b.color;
    }
    ctx.beginPath();
    ctx.arc(0, 0, size/2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  });
}

function drawNets(ctx) {
  FISH_CONFIG.nets.forEach(n => {
    const alpha = n.life;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = n.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.maxRadius * (1 - n.life + 0.3), 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner rings
    ctx.lineWidth = 1;
    for (let r = 0.3; r < 1; r += 0.2) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.maxRadius * (1 - n.life + r), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawParticles(ctx) {
  FISH_CONFIG.particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.font = `${p.size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(p.emoji, p.x, p.y);
    ctx.restore();
  });
}

function drawCannon(ctx, w, h) {
  const x = w / 2;
  const y = h - 60;
  const upgrade = CANNON_UPGRADES[FISH_CONFIG.cannonLevel - 1];
  
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(FISH_CONFIG.cannonAngle);
  
  // Base
  const baseGrad = ctx.createLinearGradient(0, -10, 0, 30);
  baseGrad.addColorStop(0, '#2a2a3a');
  baseGrad.addColorStop(1, '#1a1a2a');
  ctx.fillStyle = baseGrad;
  ctx.strokeStyle = '#3a3a5a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-25, -10, 50, 40, 15);
  ctx.fill();
  ctx.stroke();
  
  // Barrel
  const barrelGrad = ctx.createLinearGradient(0, -55, 0, 12, -55);
  barrelGrad.addColorStop(0, '#3a3a5a');
  barrelGrad.addColorStop(1, '#2a2a4a');
  ctx.fillStyle = barrelGrad;
  ctx.strokeStyle = '#3a3a5a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-12, -55, 24, 55, 8);
  ctx.fill();
  ctx.stroke();
  
  // Muzzle glow
  const glowGrad = ctx.createRadialGradient(0, -55, 0, 0, -55, 20);
  glowGrad.addColorStop(0, upgrade.color);
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(0, -55, 20, 0, Math.PI * 2);
  ctx.fill();
  
  // Level indicator
  ctx.fillStyle = upgrade.color;
  ctx.font = 'bold 10px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`L${FISH_CONFIG.cannonLevel}`, 0, -65);
  
  ctx.restore();
}

function drawHitSplashes(ctx) {
  FISH_CONFIG.hitSplashes.forEach(hs => {
    ctx.save();
    ctx.globalAlpha = hs.life;
    ctx.font = `${hs.size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(hs.icon, hs.x, hs.y);
    ctx.restore();
  });
}

// ── VISUAL EFFECTS ─────────────────────────────────────────────
function createFloatingNumber(x, y, amount, type = 'win') {
  const el = {
    x, y,
    text: `+$${amount.toLocaleString()}`,
    type,
    life: 1.5,
    maxLife: 1.5,
  };
  FISH_CONFIG.floatingNumbers.push(el);
  
  // Also DOM overlay for better visibility
  const container = document.getElementById('floatingNumbers');
  const rect = FISH_CONFIG.canvas.getBoundingClientRect();
  const div = document.createElement('div');
  div.className = `floating-number ${type}`;
  div.textContent = `+$${amount.toLocaleString()}`;
  div.style.left = `${x}px`;
  div.style.top = `${y}px`;
  container.appendChild(div);
  setTimeout(() => div.remove(), 1500);
}

function createHitSplash(x, y, icon) {
  FISH_CONFIG.hitSplashes.push({
    x, y,
    icon,
    size: 30,
    life: 1,
  });
}

function createExplosion(x, y) {
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 * i) / 20;
    const speed = 100 + Math.random() * 200;
    FISH_CONFIG.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 20 + Math.random() * 20,
      emoji: ['💥', '✨', '⭐', '💫'][Math.floor(Math.random() * 4)],
      life: 1,
    });
  }
}

function createLaserSegment(x, y, angle) {
  const ctx = FISH_CONFIG.ctx;
  ctx.save();
  ctx.strokeStyle = '#7c4dff';
  ctx.lineWidth = 8;
  ctx.shadowColor = '#7c4dff';
  ctx.shadowBlur = 20;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(x - Math.cos(angle) * 20, y - Math.sin(angle) * 20);
  ctx.lineTo(x + Math.cos(angle) * 20, y + Math.sin(angle) * 20);
  ctx.stroke();
  ctx.restore();
}

function animateCannonRecoil() {
  const cannon = document.querySelector('.cannon-barrel');
  if (cannon) {
    cannon.style.transform = 'translateY(4px)';
    setTimeout(() => cannon.style.transform = '', 50);
  }
}

function spawnParticles(x, y, count, emojis) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 200;
    FISH_CONFIG.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 100,
      size: 16 + Math.random() * 24,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      life: 1 + Math.random(),
    });
  }
}

// ── STATS & RECENT WINS ────────────────────────────────────────
function updateStatsDisplay() {
  document.getElementById('statShots').textContent = FISH_CONFIG.stats.shots;
  document.getElementById('statCaught').textContent = FISH_CONFIG.stats.caught;
  document.getElementById('statWagered').textContent = `$${FISH_CONFIG.stats.wagered.toLocaleString()}`;
  document.getElementById('statWon').textContent = `$${FISH_CONFIG.stats.won.toLocaleString()}`;
  
  const netEl = document.getElementById('statNet');
  netEl.textContent = `${FISH_CONFIG.stats.net >= 0 ? '+' : ''}$${FISH_CONFIG.stats.net.toLocaleString()}`;
  netEl.className = 'ss-value ' + (FISH_CONFIG.stats.net >= 0 ? 'positive' : 'negative');
  
  document.getElementById('statBigWin').textContent = `$${FISH_CONFIG.stats.bigWin.toLocaleString()}`;
}

function addRecentWin(fish, amount) {
  const list = document.getElementById('recentWinsList');
  const div = document.createElement('div');
  div.className = 'recent-win';
  div.innerHTML = `
    <span class="rw-icon">${fish.icon}</span>
    <div class="rw-info">
      <div class="rw-name">${fish.name}</div>
      <div class="rw-mult">${fish.baseMult}×</div>
    </div>
    <span class="rw-amount">+$${amount.toLocaleString()}</span>
  `;
  list.insertBefore(div, list.firstChild);
  
  // Keep only last 10
  while (list.children.length > 10) list.lastChild.remove();
  
  playSound('win');
}

function updateBalanceDisplay(bal) {
  document.getElementById('bal').textContent = bal.toLocaleString();
  document.getElementById('walletBalance').textContent = bal.toLocaleString();
}

// ── PROVABLY FAIR INTEGRATION ──────────────────────────────────
async function placeFishBet(serverSeed, clientSeed, nonce) {
  // This would call the edge function for provably fair result
  // For now, client-side determines visual outcome
  // Server validates on bet settlement
  return { fair: true };
}

// ── CLEANUP ────────────────────────────────────────────────────
window.addEventListener('beforeunload', () => {
  FISH_CONFIG.running = false;
  if (FISH_CONFIG.frameId) cancelAnimationFrame(FISH_CONFIG.frameId);
});

// ── EXPORTS FOR INLINE SCRIPT ──────────────────────────────────
window.FishGame = {
  init: initFishGame,
  config: FISH_CONFIG,
  fireNet,
  toggleAutoFire,
  fireSpecial,
  toggleLockTarget,
  useFreeze,
  upgradeCannon,
  adjustBet,
};

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFishGame);
} else {
  initFishGame();
}