// Fish Frenzy Game Engine
const FishGame = (function() {
  'use strict';

  // Game constants
  const CANVAS_WIDTH = window.innerWidth;
  const CANVAS_HEIGHT = window.innerHeight;
  const PLAYER_START_SIZE = 20;
  const MAX_PLAYER_SIZE = 80;
  const SIZE_GROWTH_RATE = 0.5;
  const BASE_SPEED = 3;
  const POWERUP_DURATION = 5000; // 5 seconds

  // Fish species definitions
  const FISH_SPECIES = {
    small: {
      emoji: '🐠',
      minSize: 8,
      maxSize: 15,
      speed: 1.5,
      points: 10,
      color: '#ff6b9d'
    },
    medium: {
      emoji: '🐟',
      minSize: 15,
      maxSize: 25,
      speed: 1.2,
      points: 25,
      color: '#4ecdc4'
    },
    large: {
      emoji: '🦈',
      minSize: 25,
      maxSize: 40,
      speed: 1.0,
      points: 50,
      color: '#95a5a6'
    },
    huge: {
      emoji: '🐋',
      minSize: 40,
      maxSize: 60,
      speed: 0.7,
      points: 100,
      color: '#3498db'
    }
  };

  const POWERUP_TYPES = {
    invincible: {
      emoji: '⭐',
      duration: POWERUP_DURATION,
      color: '#ffd700'
    },
    speed: {
      emoji: '⚡',
      duration: POWERUP_DURATION,
      color: '#00ff00'
    },
    magnet: {
      emoji: '🧲',
      duration: POWERUP_DURATION,
      color: '#ff00ff'
    }
  };

  // Game state
  let canvas, ctx;
  let gameRunning = false;
  let animationId;
  let lastTime = 0;
  let gameTime = 0;

  // Player state
  let player = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    size: PLAYER_START_SIZE,
    targetX: CANVAS_WIDTH / 2,
    targetY: CANVAS_HEIGHT / 2,
    speed: BASE_SPEED,
    invincible: false,
    speedBoost: false,
    magnet: false,
    emoji: '🐡'
  };

  // Game stats
  let stats = {
    score: 0,
    level: 1,
    fishEaten: 0,
    maxSize: PLAYER_START_SIZE,
    startTime: 0
  };

  // Game objects
  let fishes = [];
  let powerups = [];
  let particles = [];
  let bubbles = [];

  // Audio context for sound effects
  let audioContext;

  // Initialize game
  function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Mouse/touch controls
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchstart', handleTouchMove, { passive: false });
    
    // Create initial bubbles
    for (let i = 0; i < 20; i++) {
      bubbles.push(createBubble());
    }
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function handleMouseMove(e) {
    player.targetX = e.clientX;
    player.targetY = e.clientY;
  }

  function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    player.targetX = touch.clientX;
    player.targetY = touch.clientY;
  }

  // Start game
  function start() {
    if (!canvas) init();
    gameRunning = true;
    stats = {
      score: 0,
      level: 1,
      fishEaten: 0,
      maxSize: PLAYER_START_SIZE,
      startTime: Date.now()
    };
    player = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      size: PLAYER_START_SIZE,
      targetX: CANVAS_WIDTH / 2,
      targetY: CANVAS_HEIGHT / 2,
      speed: BASE_SPEED,
      invincible: false,
      speedBoost: false,
      magnet: false,
      emoji: '🐡'
    };
    fishes = [];
    powerups = [];
    particles = [];
    
    // Initialize audio
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Audio not supported');
    }
    
    updateUI();
    spawnFish(10);
    lastTime = Date.now();
    gameLoop();
  }

  function restart() {
    start();
  }

  // Game loop
  function gameLoop() {
    if (!gameRunning) return;
    
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    gameTime += deltaTime;
    
    update(deltaTime);
    render();
    
    animationId = requestAnimationFrame(gameLoop);
  }

  // Update game state
  function update(deltaTime) {
    // Update player position
    updatePlayer(deltaTime);
    
    // Update fishes
    updateFishes(deltaTime);
    
    // Update powerups
    updatePowerups(deltaTime);
    
    // Update particles
    updateParticles(deltaTime);
    
    // Update bubbles
    updateBubbles(deltaTime);
    
    // Check collisions
    checkCollisions();
    
    // Spawn new fish
    if (fishes.length < 10 + stats.level * 2) {
      spawnFish(1);
    }
    
    // Spawn powerups occasionally
    if (Math.random() < 0.001 && powerups.length < 3) {
      spawnPowerup();
    }
    
    // Check level up
    checkLevelUp();
  }

  function updatePlayer(deltaTime) {
    // Smooth movement towards target
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 1) {
      const speed = player.speedBoost ? player.speed * 1.8 : player.speed;
      player.x += (dx / distance) * speed;
      player.y += (dy / distance) * speed;
    }
    
    // Keep player in bounds
    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
    
    // Update player emoji based on size
    if (player.size < 20) player.emoji = '🐠';
    else if (player.size < 35) player.emoji = '🐟';
    else if (player.size < 50) player.emoji = '🐡';
    else player.emoji = '🦈';
  }

  function updateFishes(deltaTime) {
    for (let i = fishes.length - 1; i >= 0; i--) {
      const fish = fishes[i];
      
      // Move fish
      fish.x += fish.vx * deltaTime;
      fish.y += fish.vy * deltaTime;
      
      // Wrap around screen
      if (fish.x < -fish.size) fish.x = canvas.width + fish.size;
      if (fish.x > canvas.width + fish.size) fish.x = -fish.size;
      if (fish.y < -fish.size) fish.y = canvas.height + fish.size;
      if (fish.y > canvas.height + fish.size) fish.y = -fish.size;
      
      // Remove if too far
      if (fish.x < -100 || fish.x > canvas.width + 100 || 
          fish.y < -100 || fish.y > canvas.height + 100) {
        fishes.splice(i, 1);
      }
    }
  }

  function updatePowerups(deltaTime) {
    for (let i = powerups.length - 1; i >= 0; i--) {
      const powerup = powerups[i];
      powerup.lifetime -= deltaTime;
      
      if (powerup.lifetime <= 0) {
        powerups.splice(i, 1);
      }
    }
  }

  function updateParticles(deltaTime) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.lifetime -= deltaTime;
      particle.alpha = particle.lifetime / particle.maxLifetime;
      
      if (particle.lifetime <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function updateBubbles(deltaTime) {
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const bubble = bubbles[i];
      bubble.y -= bubble.speed * deltaTime;
      bubble.x += Math.sin(gameTime * 2 + i) * 0.5;
      
      if (bubble.y < -bubble.size) {
        bubble.y = canvas.height + bubble.size;
        bubble.x = Math.random() * canvas.width;
      }
    }
  }

  function checkCollisions() {
    // Check fish collisions
    for (let i = fishes.length - 1; i >= 0; i--) {
      const fish = fishes[i];
      const dx = player.x - fish.x;
      const dy = player.y - fish.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < player.size + fish.size) {
        // Collision detected
        if (player.size > fish.size * 1.1) {
          // Player eats fish
          eatFish(fish, i);
        } else if (!player.invincible && fish.size > player.size * 1.1) {
          // Fish eats player
          gameOver();
          return;
        }
      }
    }
    
    // Check powerup collisions
    for (let i = powerups.length - 1; i >= 0; i--) {
      const powerup = powerups[i];
      const dx = player.x - powerup.x;
      const dy = player.y - powerup.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < player.size + powerup.size) {
        collectPowerup(powerup, i);
      }
    }
  }

  function eatFish(fish, index) {
    // Increase player size
    const growth = fish.size * SIZE_GROWTH_RATE * 0.1;
    player.size = Math.min(MAX_PLAYER_SIZE, player.size + growth);
    stats.maxSize = Math.max(stats.maxSize, player.size);
    
    // Add score
    stats.score += fish.points;
    stats.fishEaten++;
    
    // Create particles
    createParticles(fish.x, fish.y, fish.color, 10);
    
    // Play sound
    playSound('eat');
    
    // Remove fish
    fishes.splice(index, 1);
    
    updateUI();
  }

  function collectPowerup(powerup, index) {
    const type = powerup.type;
    
    // Apply powerup effect
    switch(type) {
      case 'invincible':
        player.invincible = true;
        showPowerupIndicator('INVINCIBLE!');
        setTimeout(() => {
          player.invincible = false;
          hidePowerupIndicator();
        }, POWERUP_DURATION);
        break;
      case 'speed':
        player.speedBoost = true;
        showPowerupIndicator('SPEED BOOST!');
        setTimeout(() => {
          player.speedBoost = false;
          hidePowerupIndicator();
        }, POWERUP_DURATION);
        break;
      case 'magnet':
        player.magnet = true;
        showPowerupIndicator('MAGNET!');
        setTimeout(() => {
          player.magnet = false;
          hidePowerupIndicator();
        }, POWERUP_DURATION);
        break;
    }
    
    // Create particles
    createParticles(powerup.x, powerup.y, powerup.color, 15);
    
    // Play sound
    playSound('powerup');
    
    // Remove powerup
    powerups.splice(index, 1);
  }

  function checkLevelUp() {
    const newLevel = Math.floor(stats.score / 500) + 1;
    if (newLevel > stats.level) {
      stats.level = newLevel;
      playSound('levelup');
      createParticles(player.x, player.y, '#ffd700', 30);
    }
  }

  function spawnFish(count) {
    for (let i = 0; i < count; i++) {
      const species = Object.keys(FISH_SPECIES);
      const speciesKey = species[Math.floor(Math.random() * species.length)];
      const speciesData = FISH_SPECIES[speciesKey];
      
      const size = speciesData.minSize + Math.random() * (speciesData.maxSize - speciesData.minSize);
      const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
      
      let x, y, vx, vy;
      const speed = speciesData.speed * (1 + stats.level * 0.1);
      
      switch(side) {
        case 0: // top
          x = Math.random() * canvas.width;
          y = -size;
          vx = (Math.random() - 0.5) * speed;
          vy = speed;
          break;
        case 1: // right
          x = canvas.width + size;
          y = Math.random() * canvas.height;
          vx = -speed;
          vy = (Math.random() - 0.5) * speed;
          break;
        case 2: // bottom
          x = Math.random() * canvas.width;
          y = canvas.height + size;
          vx = (Math.random() - 0.5) * speed;
          vy = -speed;
          break;
        case 3: // left
          x = -size;
          y = Math.random() * canvas.height;
          vx = speed;
          vy = (Math.random() - 0.5) * speed;
          break;
      }
      
      fishes.push({
        x, y, vx, vy, size,
        species: speciesKey,
        emoji: speciesData.emoji,
        points: speciesData.points,
        color: speciesData.color
      });
    }
  }

  function spawnPowerup() {
    const types = Object.keys(POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const powerupData = POWERUP_TYPES[type];
    
    powerups.push({
      x: Math.random() * (canvas.width - 100) + 50,
      y: Math.random() * (canvas.height - 100) + 50,
      size: 15,
      type: type,
      emoji: powerupData.emoji,
      color: powerupData.color,
      lifetime: 10 // seconds
    });
  }

  function createBubble() {
    return {
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 100,
      size: Math.random() * 5 + 2,
      speed: Math.random() * 0.5 + 0.2
    };
  }

  function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 100,
        vy: (Math.random() - 0.5) * 100,
        size: Math.random() * 4 + 2,
        color: color,
        lifetime: 1,
        maxLifetime: 1,
        alpha: 1
      });
    }
  }

  // Render game
  function render() {
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 26, 51, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw bubbles
    drawBubbles();
    
    // Draw powerups
    drawPowerups();
    
    // Draw fishes
    drawFishes();
    
    // Draw player
    drawPlayer();
    
    // Draw particles
    drawParticles();
  }

  function drawBubbles() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    bubbles.forEach(bubble => {
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Draw glow if invincible
    if (player.invincible) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ffd700';
    }
    
    // Draw fish
    ctx.font = `${player.size * 2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.emoji, 0, 0);
    
    ctx.restore();
  }

  function drawFishes() {
    fishes.forEach(fish => {
      ctx.save();
      ctx.translate(fish.x, fish.y);
      ctx.font = `${fish.size * 2}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fish.emoji, 0, 0);
      ctx.restore();
    });
  }

  function drawPowerups() {
    powerups.forEach(powerup => {
      ctx.save();
      ctx.translate(powerup.x, powerup.y);
      ctx.font = `${powerup.size * 2}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 15;
      ctx.shadowColor = powerup.color;
      ctx.fillText(powerup.emoji, 0, 0);
      ctx.restore();
    });
  }

  function drawParticles() {
    particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // UI functions
  function updateUI() {
    document.getElementById('score').textContent = stats.score;
    document.getElementById('size').textContent = player.size.toFixed(1) + 'x';
    document.getElementById('level').textContent = stats.level;
    
    const progress = (stats.score % 500) / 500 * 100;
    document.getElementById('levelProgress').style.width = progress + '%';
  }

  function showPowerupIndicator(text) {
    const indicator = document.getElementById('powerupIndicator');
    indicator.textContent = text;
    indicator.classList.add('active');
  }

  function hidePowerupIndicator() {
    const indicator = document.getElementById('powerupIndicator');
    indicator.classList.remove('active');
  }

  function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    const survivalTime = Math.floor((Date.now() - stats.startTime) / 1000);
    
    document.getElementById('finalScore').textContent = stats.score;
    document.getElementById('fishEaten').textContent = stats.fishEaten;
    document.getElementById('maxSize').textContent = stats.maxSize.toFixed(1) + 'x';
    document.getElementById('levelReached').textContent = stats.level;
    document.getElementById('timeSurvived').textContent = survivalTime + 's';
    
    document.getElementById('gameOverScreen').classList.remove('hidden');
    
    playSound('gameover');
  }

  // Sound effects (simple beeps)
  function playSound(type) {
    if (!audioContext) return;
    
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      switch(type) {
        case 'eat':
          oscillator.frequency.value = 600;
          gainNode.gain.value = 0.1;
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.1);
          break;
        case 'powerup':
          oscillator.frequency.value = 800;
          gainNode.gain.value = 0.15;
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.2);
          break;
        case 'levelup':
          oscillator.frequency.value = 1000;
          gainNode.gain.value = 0.2;
          oscillator.start();
          setTimeout(() => {
            oscillator.frequency.value = 1200;
          }, 100);
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
        case 'gameover':
          oscillator.frequency.value = 200;
          gainNode.gain.value = 0.2;
          oscillator.start();
          setTimeout(() => {
            oscillator.frequency.value = 150;
          }, 200);
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
      }
    } catch (e) {
      console.log('Sound error:', e);
    }
  }

  // Public API
  return {
    start,
    restart,
    init
  };
})();

// Initialize on load
window.addEventListener('load', () => {
  FishGame.init();
});