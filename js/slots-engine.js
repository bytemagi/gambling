// slots-engine.js — Advanced Slot Engine with 5 Game Types & Bonus Features
// ────────────────────────────────────────────────────────────────

const SLOTS_ENGINE = {
  // ── GAME CONFIGURATIONS ──────────────────────────────────────
  GAMES: {
    classic: {
      id: 'classic',
      name: 'Classic 7s',
      icon: '🎰',
      type: 'classic',
      reels: 3, rows: 3, paylines: 5,
      theme: 'purple',
      rtp: 96.5, volatility: 'Medium',
      minBet: 1, maxBet: 500, maxMult: 500,
      features: ['Wild', 'Respins', 'Progressive Jackpot'],
      symbols: {
        '7️⃣': { value: 500, weight: 5, special: 'jackpot' },
        '💎': { value: 100, weight: 10, special: 'wild' },
        '⭐': { value: 50, weight: 15 },
        '🔔': { value: 25, weight: 20 },
        '🍒': { value: 10, weight: 30 },
        '🍋': { value: 5, weight: 35 },
        '🍊': { value: 3, weight: 40 },
        '🍉': { value: 2, weight: 45 },
      },
      paylines: [
        [1,1,1,1,1], // middle
        [0,0,0,0,0], // top
        [2,2,2,2,2], // bottom
        [0,1,2,1,0], // V
        [2,1,0,1,2], // inverted V
      ],
      bonusConfig: {
        type: 'wheel',
        trigger: '3+ bonus symbols',
        wheelSegments: [
          { label: 'FREE SPINS ×10', weight: 20, reward: { type: 'freespins', count: 10 } },
          { label: '50× BET', weight: 25, reward: { type: 'instant', mult: 50 } },
          { label: 'FREE SPINS ×5', weight: 30, reward: { type: 'freespins', count: 5 } },
          { label: '20× BET', weight: 15, reward: { type: 'instant', mult: 20 } },
          { label: 'JACKPOT!', weight: 2, reward: { type: 'jackpot' } },
          { label: '100× BET', weight: 5, reward: { type: 'instant', mult: 100 } },
          { label: 'FREE SPINS ×15', weight: 2, reward: { type: 'freespins', count: 15 } },
          { label: '500× BET', weight: 1, reward: { type: 'instant', mult: 500 } },
        ]
      }
    },

    fruit: {
      id: 'fruit',
      name: 'Fruit Fiesta',
      icon: '🍒',
      type: 'video',
      reels: 5, rows: 3, paylines: 20,
      theme: 'tropical',
      rtp: 96.2, volatility: 'Low',
      minBet: 1, maxBet: 1000, maxMult: 1000,
      features: ['Cascading Reels', 'Free Spins', 'Multiplier', 'Fruit Collection'],
      symbols: {
        '🍇': { value: 50, weight: 10, special: 'scatter' },
        '🍉': { value: 30, weight: 15 },
        '🍊': { value: 20, weight: 20 },
        '🍋': { value: 15, weight: 25 },
        '🍌': { value: 10, weight: 30 },
        '🍒': { value: 5, weight: 40, special: 'wild' },
        '🍓': { value: 3, weight: 45 },
        '🍍': { value: 2, weight: 50 },
      },
      bonusConfig: {
        type: 'freespins_pick',
        trigger: '3+ scatter',
        freespins: [8, 10, 12, 15],
        pickOptions: 4,
        features: [
          { name: 'Extra Spins', icon: '🔄', values: [2, 3, 5] },
          { name: 'Multiplier', icon: '✖️', values: [2, 3, 5, 10] },
          { name: 'Expanding Wild', icon: '🌟', values: [true] },
          { name: 'Sticky Wild', icon: '🧲', values: [true] },
          { name: 'Symbol Upgrade', icon: '⬆️', values: [true] },
        ]
      }
    },

    diamond: {
      id: 'diamond',
      name: 'Diamond Rush',
      icon: '💎',
      type: 'video',
      reels: 5, rows: 4, paylines: 40,
      theme: 'gold',
      rtp: 95.8, volatility: 'High',
      minBet: 5, maxBet: 2000, maxMult: 5000,
      features: ['Mega Multiplier', 'Bonus Round', 'Diamond Collection', 'Progressive'],
      symbols: {
        '💎': { value: 200, weight: 5, special: 'wild' },
        '🔥': { value: 100, weight: 8 },
        '💫': { value: 50, weight: 12 },
        '✨': { value: 25, weight: 18 },
        '🌟': { value: 15, weight: 25 },
        '⭐': { value: 8, weight: 35 },
        '💰': { value: 500, weight: 3, special: 'scatter' },
        '💍': { value: 300, weight: 4 },
      },
      bonusConfig: {
        type: 'pickme',
        trigger: '3+ scatter',
        picks: 3,
        grid: 4, // 4x4 = 16 positions
        prizes: [
          { type: 'mult', value: 200, weight: 5, label: '200×' },
          { type: 'mult', value: 100, weight: 8, label: '100×' },
          { type: 'mult', value: 50, weight: 12, label: '50×' },
          { type: 'mult', value: 25, weight: 15, label: '25×' },
          { type: 'mult', value: 15, weight: 18, label: '15×' },
          { type: 'mult', value: 10, weight: 20, label: '10×' },
          { type: 'freespins', value: 12, weight: 8, label: '12 FS' },
          { type: 'freespins', value: 8, weight: 10, label: '8 FS' },
          { type: 'collect', value: 'all', weight: 4, label: 'COLLECT ALL' },
        ]
      }
    },

    wild: {
      id: 'wild',
      name: 'Wild West Gold',
      icon: '🤠',
      type: 'video',
      reels: 5, rows: 3, paylines: 25,
      theme: 'western',
      rtp: 96.0, volatility: 'High',
      minBet: 1, maxBet: 1000, maxMult: 10000,
      features: ['Sticky Wilds', 'Money Collect', 'Free Spins', 'Buy Feature'],
      symbols: {
        '🤠': { value: 100, weight: 8, special: 'wild' },
        '💰': { value: 50, weight: 10, special: 'money' },
        '🦬': { value: 30, weight: 15 },
        '🌵': { value: 20, weight: 20 },
        '⭐': { value: 15, weight: 25 },
        '🔫': { value: 10, weight: 30 },
        '🥃': { value: 5, weight: 35 },
        '🐎': { value: 300, weight: 4, special: 'scatter' },
      },
      bonusConfig: {
        type: 'moneytrain',
        trigger: '6+ money symbols',
        respins: 3,
        moneyValues: [1, 2, 3, 5, 8, 10, 15, 20, 50, 100, 200, 500, 1000],
        specials: [
          { name: 'Collector', icon: '🧲', weight: 5, action: 'collect_all' },
          { name: 'Payer', icon: '💸', weight: 5, action: 'add_to_all' },
          { name: 'Sniper', icon: '🎯', weight: 3, action: 'double_random' },
          { name: 'Necromancer', icon: '💀', weight: 2, action: 'revive' },
          { name: 'Persistent Collector', icon: '🧲✨', weight: 1, action: 'persist_collect' },
          { name: 'Persistent Payer', icon: '💸✨', weight: 1, action: 'persist_pay' },
        ]
      }
    },

    megaways: {
      id: 'megaways',
      name: 'Megaways Madness',
      icon: '⚡',
      type: 'megaways',
      reels: 6, rows: 7, maxWays: 117649,
      theme: 'neon',
      rtp: 96.1, volatility: 'Very High',
      minBet: 1, maxBet: 500, maxMult: 50000,
      features: ['Cascading Reels', 'Unlimited Multiplier', 'Free Spins', 'Feature Buy'],
      symbols: {
        '💎': { value: 50, weight: 5, special: 'wild' },
        '★': { value: 25, weight: 8 },
        '🎧': { value: 12, weight: 15 },
        '🕶️': { value: 10, weight: 20 },
        '🌃': { value: 8, weight: 25 },
        '🔋': { value: 6, weight: 30 },
        '🧊': { value: 5, weight: 35 },
        '⚡': { value: 500, weight: 3, special: 'scatter' },
      },
      bonusConfig: {
        type: 'freespins_unlimited',
        trigger: '4+ scatter',
        baseSpins: 12,
        extraPerScatter: 3,
        multiplierStart: 1,
        multiplierIncrease: 1,
        maxMultiplier: 9999,
        retrigger: true,
      }
    },

    treasure: {
      id: 'treasure',
      name: 'Treasure Quest',
      icon: '🏴‍☠️',
      type: 'video',
      reels: 5, rows: 3, paylines: 25,
      theme: 'gold',
      rtp: 96.3, volatility: 'Medium-High',
      minBet: 1, maxBet: 1000, maxMult: 20000,
      features: ['Treasure Hunt', 'Expanding Wilds', 'Free Spins', 'Map Bonus'],
      symbols: {
        '🏴‍☠️': { value: 100, weight: 8, special: 'wild' },
        '💰': { value: 50, weight: 10, special: 'map' },
        '🪙': { value: 30, weight: 15 },
        '🗺️': { value: 20, weight: 20 },
        '⚓': { value: 15, weight: 25 },
        '🦜': { value: 10, weight: 30 },
        '🔑': { value: 8, weight: 35 },
        '💎': { value: 500, weight: 3, special: 'scatter' },
      },
      bonusConfig: {
        type: 'map',
        trigger: '3+ scatter',
        mapSize: 5, // 5x5
        steps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 50],
        prizes: {
          1: { type: 'mult', value: 2 },
          5: { type: 'mult', value: 10 },
          10: { type: 'freespins', value: 10 },
          15: { type: 'mult', value: 50 },
          20: { type: 'freespins', value: 15 },
          25: { type: 'mult', value: 200 },
          50: { type: 'jackpot' },
        },
        traps: { weight: 15, effect: 'end' },
        chests: { weight: 20, prizes: [5, 10, 15, 20, 50, 100] },
      }
    },

    pharaoh: {
      id: 'pharaoh',
      name: "Pharaoh's Riches",
      icon: '👑',
      type: 'video',
      reels: 5, rows: 3, paylines: 20,
      theme: 'gold',
      rtp: 95.9, volatility: 'High',
      minBet: 1, maxBet: 1000, maxMult: 10000,
      features: ['Expanding Wild', 'Free Spins', 'Symbol Upgrade', 'Gamble'],
      symbols: {
        '👑': { value: 500, weight: 4, special: 'wild' },
        '🔺': { value: 200, weight: 6 },
        '🪆': { value: 100, weight: 10 },
        '🦂': { value: 50, weight: 15 },
        '📜': { value: 25, weight: 20 },
        '🪙': { value: 15, weight: 25 },
        '🪨': { value: 8, weight: 30 },
        '🐍': { value: 300, weight: 4, special: 'scatter' },
      },
      bonusConfig: {
        type: 'expanding_wild_fs',
        trigger: '3+ scatter',
        spins: 10,
        expandingWild: true,
        upgradeSymbol: true,
        gamble: { type: 'color', maxDouble: 5 },
      }
    },
  },

  // ── STATE ────────────────────────────────────────────────────
  state: {
    currentGame: null,
    balance: 0,
    bet: 1,
    lines: 1,
    totalBet: 1,
    spinning: false,
    autoSpins: 0,
    turbo: false,
    freeSpins: 0,
    freeSpinsTotal: 0,
    bonusMode: null,
    bonusData: null,
    lastWin: 0,
    totalWon: 0,
    totalWagered: 0,
    sessionSpins: 0,
    reelStrips: [],
    visibleSymbols: [],
    activePaylines: [],
    winLines: [],
    cascadeCount: 0,
    megawaysRows: [],
    featureBuyPrice: 0,
  },

  // ── SOUND HELPERS ────────────────────────────────────────────
  playSound(name) {
    if (window.playSound) window.playSound(name);
  },

  // ── INITIALIZATION ──────────────────────────────────────────
  async init(gameId) {
    const game = this.GAMES[gameId];
    if (!game) throw new Error(`Game ${gameId} not found`);

    this.state.currentGame = game;
    this.state.bet = game.minBet;
    this.state.lines = game.paylines || 1;
    this.state.totalBet = this.state.bet * this.state.lines;

    // Generate reel strips
    this.generateReelStrips(game);

    // Setup UI
    this.setupUI();

    // Load balance
    await this.loadBalance();

    // Restore session if any
    this.restoreSession();

    // Start animation loop
    this.animate();

    console.log(`🎰 ${game.name} initialized`);
  },

  generateReelStrips(game) {
    this.state.reelStrips = [];
    const symbols = Object.keys(game.symbols);

    for (let r = 0; r < game.reels; r++) {
      const strip = [];
      const stripLength = game.type === 'megaways' ? 100 : 80;

      for (let i = 0; i < stripLength; i++) {
        // Weighted random
        let rand = Math.random();
        let cumWeight = 0;
        let selected = symbols[0];

        for (const sym of symbols) {
          cumWeight += game.symbols[sym].weight;
          if (rand < cumWeight / this.getTotalWeight(game)) {
            selected = sym;
            break;
          }
        }
        strip.push(selected);
      }
      this.state.reelStrips.push(strip);
    }
  },

  getTotalWeight(game) {
    return Object.values(game.symbols).reduce((sum, s) => sum + s.weight, 0);
  },

  // ── BALANCE ──────────────────────────────────────────────────
  async loadBalance() {
    const profile = await fetchProfile();
    if (profile) {
      this.state.balance = profile.balance;
      this.updateBalanceDisplay();
    }
  },

  updateBalanceDisplay() {
    const els = ['balanceAmount', 'walletBalance', 'bal'];
    els.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = this.state.balance.toLocaleString();
    });
    const spinCostEl = document.getElementById('spinCost');
    if (spinCostEl) spinCostEl.textContent = this.state.totalBet.toLocaleString();
  },

  // ── REEL ANIMATION ──────────────────────────────────────────
  animate() {
    this.renderReels();
    requestAnimationFrame(() => this.animate());
  },

  renderReels() {
    const game = this.state.currentGame;
    if (!game) return;

    const strips = this.state.visibleSymbols || this.getInitialVisibleSymbols();
    const container = document.querySelector('.reels-container');
    if (!container) return;

    // Update each reel
    for (let r = 0; r < game.reels; r++) {
      const reelEl = container.querySelector(`.reel[data-reel="${r}"] .reel-strip`);
      if (!reelEl) return;

      // Only update if spinning or initial render
      if (this.state.spinning || !reelEl.innerHTML) {
        reelEl.innerHTML = strips[r].map(sym => `
          <div class="reel-symbol" data-symbol="${sym}">${sym}</div>
        `).join('');
      }
    }
  },

  getInitialVisibleSymbols() {
    const game = this.state.currentGame;
    const rows = game.rows || 3;
    const visible = [];

    for (let r = 0; r < game.reels; r++) {
      const strip = this.state.reelStrips[r];
      const reelVisible = [];
      for (let i = 0; i < rows; i++) {
        const idx = Math.floor(Math.random() * strip.length);
        reelVisible.push(strip[idx]);
      }
      visible.push(reelVisible);
    }
    this.state.visibleSymbols = visible;
    return visible;
  },

  // ── SPIN LOGIC ──────────────────────────────────────────────
  async spin() {
    if (this.state.spinning) return;

    const game = this.state.currentGame;
    const cost = this.state.totalBet;

    if (this.state.balance < cost) {
      this.showToast('Insufficient balance', 'error');
      return;
    }

    // Deduct bet
    this.state.balance -= cost;
    this.state.totalWagered += cost;
    this.state.sessionSpins++;
    this.updateBalanceDisplay();
    window.updateBal?.(this.state.balance);

    this.state.spinning = true;
    this.state.lastWin = 0;
    this.state.winLines = [];
    this.hideResultBanner();

    // Update UI
    this.setSpinButtonState(true);
    this.playSound('spin');

    // Generate server seed for provably fair
    const clientSeed = getClientSeed();
    const nonce = incrementNonce();

    try {
      // Call edge function for provably fair result
      const result = await this.getServerResult(game.id, cost, clientSeed, nonce);

      // Animate reels to result
      await this.animateReelsToResult(result);

      // Process wins
      await this.processResult(result);

      // Check for bonus trigger
      if (result.bonus) {
        await this.triggerBonus(result.bonus);
      }

      // Handle cascades for megaways/video
      if (game.type === 'megaways' || game.type === 'video') {
        await this.handleCascades(result);
      }

    } catch (error) {
      console.error('Spin error:', error);
      this.showResult('Error occurred', 'lose');
      this.playSound('lose');
    } finally {
      this.state.spinning = false;
      this.setSpinButtonState(false);

      // Auto spin
      if (this.state.autoSpins > 0) {
        this.state.autoSpins--;
        this.updateAutoSpinDisplay();
        setTimeout(() => this.spin(), this.state.turbo ? 200 : 800);
      }
    }
  },

  async getServerResult(gameId, bet, clientSeed, nonce) {
    const session = await getSession();
    if (!session) throw new Error('Not logged in');

    const res = await fetch(`${SUPABASE_URL}/functions/v1/place-bet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        game: gameId,
        amount: bet,
        choice: { clientSeed, nonce },
        clientSeed,
        nonce,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Server error');
    }

    return res.json();
  },

  async animateReelsToResult(result) {
    const game = this.state.currentGame;
    const rows = game.rows || 3;
    const reels = game.reels;

    // Get final symbol grid from result
    const finalGrid = result.grid || this.generateGridFromOutcome(result);

    // Animate each reel
    const reelElements = document.querySelectorAll('.reel .reel-strip');
    const spinDuration = this.state.turbo ? 400 : 1200;

    for (let r = 0; r < reels; r++) {
      const reelEl = reelElements[r];
      if (!reelEl) continue;

      const delay = r * 150;
      const targetSymbols = finalGrid.map(row => row[r]);

      await this.spinReelToTarget(reelEl, targetSymbols, spinDuration, delay);
    }

    // Small delay after all reels stop
    await new Promise(r => setTimeout(r, 300));
  },

  spinReelToTarget(reelEl, targetSymbols, duration, delay) {
    return new Promise(resolve => {
      setTimeout(() => {
        const strip = reelEl;
        const symbolHeight = 120; // CSS height
        const totalSymbols = targetSymbols.length + 20; // overspin
        const targetOffset = -((targetSymbols.length - 1) * symbolHeight);

        strip.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        strip.style.transform = `translateY(${targetOffset}px)`;

        setTimeout(() => {
          // Update to exact symbols
          strip.innerHTML = targetSymbols.map(sym => `
            <div class="reel-symbol" data-symbol="${sym}">${sym}</div>
          `).join('');
          strip.style.transition = 'none';
          strip.style.transform = 'translateY(0)';
          resolve();
        }, duration);
      }, delay);
    });
  },

  generateGridFromOutcome(result) {
    const game = this.state.currentGame;
    const rows = game.rows || 3;
    const reels = game.reels;
    const grid = [];

    // Use outcome from server
    if (result.outcome && result.outcome.grid) {
      return result.outcome.grid;
    }

    // Fallback: generate random grid
    for (let row = 0; row < rows; row++) {
      grid[row] = [];
      for (let reel = 0; reel < reels; reel++) {
        const strip = this.state.reelStrips[reel];
        const idx = Math.floor(Math.random() * strip.length);
        grid[row][reel] = strip[idx];
      }
    }
    return grid;
  },

  async processResult(result) {
    const game = this.state.currentGame;
    const grid = result.grid || this.generateGridFromOutcome(result);
    const rows = game.rows || 3;
    const reels = game.reels;

    // Calculate wins
    const wins = this.calculateWins(grid, game);
    const totalWin = wins.reduce((sum, w) => sum + w.amount, 0);

    // Update balance
    if (totalWin > 0) {
      this.state.balance += totalWin;
      this.state.totalWon += totalWin;
      this.state.lastWin = totalWin;
      this.updateBalanceDisplay();
      window.updateBal?.(this.state.balance);
    }

    // Highlight win lines
    this.highlightWins(wins);

    // Show result
    if (totalWin > 0) {
      const mult = totalWin / this.state.totalBet;
      if (mult >= 100) {
        this.showResult(`💎 MEGA WIN! +$${totalWin.toLocaleString()}`, 'jackpot');
        this.playSound('jackpot');
        this.triggerParticles('jackpot');
      } else if (mult >= 20) {
        this.showResult(`🎉 BIG WIN! +$${totalWin.toLocaleString()}`, 'bigwin');
        this.playSound('bigwin');
        this.triggerParticles('bigwin');
      } else {
        this.showResult(`✨ WIN! +$${totalWin.toLocaleString()}`, 'win');
        this.playSound('win');
        this.triggerParticles('win');
      }
    } else {
      this.showResult('No win this spin', 'lose');
      this.playSound('lose');
    }

    // Update stats
    this.updateSessionStats();
  },

  calculateWins(grid, game) {
    const wins = [];
    const rows = game.rows || 3;

    if (game.type === 'megaways') {
      return this.calculateMegawaysWins(grid, game);
    }

    // Standard payline evaluation
    const paylines = game.paylines || [[1,1,1,1,1]];
    const symbols = game.symbols;

    for (let i = 0; i < paylines.length; i++) {
      const line = paylines[i];
      const lineSymbols = [];
      let winSymbol = null;
      let winCount = 0;

      for (let r = 0; r < game.reels; r++) {
        const row = line[r] % rows;
        const sym = grid[row]?.[r];
        if (!sym) break;

        if (r === 0) {
          winSymbol = sym;
          winCount = 1;
        } else {
          const symDef = symbols[sym];
          const winDef = symbols[winSymbol];

          // Check match (wilds substitute)
          const isWild = symDef?.special === 'wild' || winDef?.special === 'wild';
          if (sym === winSymbol || isWild) {
            winCount++;
          } else {
            break;
          }
        }
        lineSymbols.push({ reel: r, row, symbol: sym });
      }

      if (winCount >= 2 && winSymbol) {
        const mult = symbols[winSymbol]?.value || 0;
        if (mult > 0) {
          const amount = Math.round(this.state.bet * mult * (winCount / 3));
          wins.push({
            line: i,
            symbol: winSymbol,
            count: winCount,
            mult,
            amount,
            positions: lineSymbols,
          });
        }
      }
    }

    // Scatter wins
    const scatterCount = this.countScatters(grid, game);
    if (scatterCount >= 3) {
      const scatterSym = Object.keys(game.symbols).find(s => game.symbols[s].special === 'scatter');
      if (scatterSym) {
        const mult = game.symbols[scatterSym].value * (scatterCount / 3);
        const amount = Math.round(this.state.totalBet * mult);
        wins.push({
          type: 'scatter',
          symbol: scatterSym,
          count: scatterCount,
          mult,
          amount,
          positions: this.findScatterPositions(grid, scatterSym),
        });
      }
    }

    return wins;
  },

  calculateMegawaysWins(grid, game) {
    // Megaways: adjacent reels left to right, any row
    const wins = [];
    const reels = grid[0]?.length || game.reels;

    // Group symbols by reel
    const reelSymbols = grid.map(row => row.filter(s => s));

    // For each symbol type, check adjacent reels
    const allSymbols = new Set(grid.flat());
    for (const sym of allSymbols) {
      const symDef = game.symbols[sym];
      if (!symDef) continue;

      let count = 0;
      const positions = [];

      for (let r = 0; r < reels; r++) {
        const reelSyms = grid.map(row => row[r]).filter(Boolean);
        const match = reelSyms.find(s => s === sym || game.symbols[s]?.special === 'wild' || symDef.special === 'wild');
        if (match) {
          count++;
          positions.push({ reel: r, symbol: match });
        } else {
          break; // Must be adjacent from left
        }
      }

      if (count >= 2) { // Minimum 2 for megaways
        const amount = Math.round(this.state.bet * symDef.value * count);
        wins.push({
          type: 'megaways',
          symbol: sym,
          count,
          mult: symDef.value * count,
          amount,
          positions,
        });
      }
    }

    return wins;
  },

  countScatters(grid, game) {
    const scatterSym = Object.keys(game.symbols).find(s => game.symbols[s].special === 'scatter');
    if (!scatterSym) return 0;
    return grid.flat().filter(s => s === scatterSym).length;
  },

  findScatterPositions(grid, sym) {
    const pos = [];
    grid.forEach((row, r) => {
      row.forEach((s, c) => {
        if (s === sym) pos.push({ reel: c, row: r });
      });
    });
    return pos;
  },

  highlightWins(wins) {
    wins.forEach(win => {
      if (win.positions) {
        win.positions.forEach(p => {
          const symbolEl = document.querySelector(`.reel[data-reel="${p.reel}"] .reel-symbol:nth-child(${p.row + 1})`);
          if (symbolEl) {
            symbolEl.classList.add('winning');
            setTimeout(() => symbolEl.classList.remove('winning'), 3000);
          }
        });
      }
    });
  },

  // ── CASCADING REELS ─────────────────────────────────────────
  async handleCascades(initialResult) {
    const game = this.state.currentGame;
    if (!['megaways', 'video'].includes(game.type)) return;

    let currentGrid = initialResult.grid || this.generateGridFromOutcome(initialResult);
    let cascadeCount = 0;
    const maxCascades = 15;

    while (cascadeCount < maxCascades) {
      const wins = this.calculateWins(currentGrid, game);
      if (wins.length === 0) break;

      cascadeCount++;
      this.state.cascadeCount = cascadeCount;

      // Remove winning symbols
      const winPositions = new Set();
      wins.forEach(w => w.positions?.forEach(p => winPositions.add(`${p.reel},${p.row}`)));

      // Animate removal
      await this.animateSymbolRemoval(winPositions);

      // Drop symbols down
      currentGrid = this.dropSymbols(currentGrid, game);

      // Fill top with new symbols
      currentGrid = this.fillTopSymbols(currentGrid, game);

      // Animate new symbols falling
      await this.animateCascade(currentGrid);

      // Calculate new wins
      const newWins = this.calculateWins(currentGrid, game);
      if (newWins.length === 0) break;

      const cascadeWin = newWins.reduce((sum, w) => sum + w.amount, 0);
      if (cascadeWin > 0) {
        this.state.balance += cascadeWin;
        this.state.totalWon += cascadeWin;
        this.state.lastWin += cascadeWin;
        this.updateBalanceDisplay();
        window.updateBal?.(this.state.balance);

        this.showResult(`🌊 CASCADE ${cascadeCount}! +$${cascadeWin.toLocaleString()}`, 'win');
        this.playSound('win');
      }
    }

    if (cascadeCount > 0) {
      this.showResult(`💎 ${cascadeCount} CASCADES! Total: +$${this.state.lastWin.toLocaleString()}`, 'bigwin');
      this.triggerParticles('bigwin');
    }
  },

  dropSymbols(grid, game) {
    const rows = game.rows || 3;
    const reels = game.reels;
    const newGrid = Array.from({ length: rows }, () => Array(reels).fill(null));

    for (let c = 0; c < reels; c++) {
      let writeRow = rows - 1;
      for (let r = rows - 1; r >= 0; r--) {
        if (grid[r][c] !== null) {
          newGrid[writeRow][c] = grid[r][c];
          writeRow--;
        }
      }
    }
    return newGrid;
  },

  fillTopSymbols(grid, game) {
    const rows = game.rows || 3;
    const reels = game.reels;

    for (let c = 0; c < reels; c++) {
      for (let r = 0; r < rows; r++) {
        if (grid[r][c] === null) {
          const strip = this.state.reelStrips[c];
          const idx = Math.floor(Math.random() * strip.length);
          grid[r][c] = strip[idx];
        }
      }
    }
    return grid;
  },

  async animateSymbolRemoval(positions) {
    // Visual removal animation
    for (const pos of positions) {
      const [reel, row] = pos.split(',').map(Number);
      const symbolEl = document.querySelector(`.reel[data-reel="${reel}"] .reel-symbol:nth-child(${row + 1})`);
      if (symbolEl) {
        symbolEl.style.animation = 'cascadeRemove 0.4s ease-out forwards';
      }
    }
    await new Promise(r => setTimeout(r, 400));
  },

  async animateCascade(grid) {
    // Re-render all reels with new grid
    const container = document.querySelector('.reels-container');
    if (!container) return;

    const game = this.state.currentGame;
    for (let r = 0; r < game.reels; r++) {
      const reelEl = container.querySelector(`.reel[data-reel="${r}"] .reel-strip`);
      if (reelEl) {
        reelEl.innerHTML = grid.map(row => row[r]).map(sym => `
          <div class="reel-symbol cascade-new" data-symbol="${sym}">${sym}</div>
        `).join('');
      }
    }
    await new Promise(r => setTimeout(r, 300));
  },

  // ── BONUS FEATURES ──────────────────────────────────────────
  async triggerBonus(bonusType) {
    const game = this.state.currentGame;
    const config = game.bonusConfig;
    if (!config) return;

    this.state.bonusMode = bonusType;
    this.state.bonusData = { ...config };

    this.showBonusOverlay(bonusType);

    switch (config.type) {
      case 'wheel':
        await this.runWheelBonus(config);
        break;
      case 'freespins_pick':
        await this.runFreespinsPickBonus(config);
        break;
      case 'pickme':
        await this.runPickMeBonus(config);
        break;
      case 'moneytrain':
        await this.runMoneyTrainBonus(config);
        break;
      case 'freespins_unlimited':
        await this.runUnlimitedFreespins(config);
        break;
      case 'map':
        await this.runMapBonus(config);
        break;
      case 'expanding_wild_fs':
        await this.runExpandingWildFS(config);
        break;
    }

    this.hideBonusOverlay();
    this.state.bonusMode = null;
    this.state.bonusData = null;
  },

  showBonusOverlay(type) {
    let html = '';
    switch (type) {
      case 'wheel':
        html = this.getWheelBonusHTML();
        break;
      case 'freespins_pick':
        html = this.getFreespinsPickHTML();
        break;
      case 'pickme':
        html = this.getPickMeHTML();
        break;
      case 'moneytrain':
        html = this.getMoneyTrainHTML();
        break;
      case 'freespins_unlimited':
        html = this.getUnlimitedFSHTML();
        break;
      case 'map':
        html = this.getMapBonusHTML();
        break;
      case 'expanding_wild_fs':
        html = this.getExpandingWildFSHTML();
        break;
    }

    const overlay = document.createElement('div');
    overlay.className = 'bonus-overlay';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    this.bonusOverlay = overlay;
  },

  hideBonusOverlay() {
    if (this.bonusOverlay) {
      this.bonusOverlay.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => this.bonusOverlay?.remove(), 300);
      this.bonusOverlay = null;
    }
  },

  // ── WHEEL BONUS ─────────────────────────────────────────────
  getWheelBonusHTML() {
    const segments = this.state.bonusData.wheelSegments;
    return `
      <div class="bonus-modal wheel-bonus">
        <div class="bonus-header">
          <h3>🎰 BONUS WHEEL</h3>
          <div class="wheel-spins">SPINS: <span id="wheelSpins">1</span></div>
        </div>
        <div class="wheel-container">
          <canvas id="bonusWheel" width="400" height="400"></canvas>
          <button class="btn btn-primary btn-lg wheel-spin-btn" id="spinWheelBtn">SPIN</button>
        </div>
        <div class="wheel-result" id="wheelResult" style="display:none"></div>
      </div>
    `;
  },

  async runWheelBonus(config) {
    const canvas = document.getElementById('bonusWheel');
    const ctx = canvas.getContext('2d');
    const segments = config.wheelSegments;
    const segAngle = (Math.PI * 2) / segments.length;
    let currentRotation = 0;
    let spinning = false;
    let spinsLeft = 1;

    // Draw wheel
    const drawWheel = (rotation) => {
      ctx.clearRect(0, 0, 400, 400);
      const centerX = 200, centerY = 200, radius = 180;

      segments.forEach((seg, i) => {
        const startAngle = i * segAngle + rotation;
        const endAngle = startAngle + segAngle;

        // Segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = i % 2 === 0 ? '#f5c518' : '#d4a00a';
        ctx.fill();
        ctx.strokeStyle = '#9a7c0a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + segAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#0a0b10';
        ctx.font = 'bold 14px Oswald';
        ctx.fillText(seg.label, radius - 20, 5);
        ctx.restore();
      });

      // Center circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0b10';
      ctx.fill();
      ctx.strokeStyle = '#f5c518';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#f5c518';
      ctx.font = 'bold 16px Oswald';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SPIN', centerX, centerY);
    };

    drawWheel(0);

    // Pointer
    const pointer = document.createElement('div');
    pointer.className = 'wheel-pointer';
    pointer.innerHTML = '▼';
    pointer.style.cssText = 'position:absolute;top:10px;left:50%;transform:translateX(-50%);font-size:2rem;color:#f5c518;z-index:10;animation:bounce 0.5s ease-in-out infinite;';
    canvas.parentElement.appendChild(pointer);

    document.getElementById('spinWheelBtn').addEventListener('click', async () => {
      if (spinning || spinsLeft <= 0) return;

      spinning = true;
      spinsLeft--;
      document.getElementById('wheelSpins').textContent = spinsLeft;
      document.getElementById('spinWheelBtn').disabled = true;

      // Pick random segment (weighted)
      const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
      let rand = Math.random() * totalWeight;
      let selectedIndex = 0;
      for (let i = 0; i < segments.length; i++) {
        rand -= segments[i].weight;
        if (rand <= 0) { selectedIndex = i; break; }
      }

      const targetRotation = (Math.PI * 2) * 5 + (selectedIndex + 0.5) * segAngle - Math.PI / 2;
      const startRotation = currentRotation;
      const duration = 4000;
      const startTime = performance.now();

      const animate = (time) => {
        const progress = Math.min(1, (time - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        currentRotation = startRotation + (targetRotation - startRotation) * eased;
        drawWheel(currentRotation);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          spinning = false;
          currentRotation = targetRotation % (Math.PI * 2);

          // Show result
          const reward = segments[selectedIndex].reward;
          this.awardWheelReward(reward);
          document.getElementById('wheelResult').innerHTML = `
            <h4>${reward.type === 'jackpot' ? '💎 JACKPOT!' : `🎉 ${reward.label || reward.type.toUpperCase()}`}</h4>
            <p>${this.formatReward(reward)}</p>
          `;
          document.getElementById('wheelResult').style.display = 'block';

          if (spinsLeft > 0) {
            document.getElementById('spinWheelBtn').disabled = false;
          } else {
            setTimeout(() => this.hideBonusOverlay(), 3000);
          }
        }
      };

      requestAnimationFrame(animate);
    });
  },

  formatReward(reward) {
    switch (reward.type) {
      case 'freespins': return `${reward.count} Free Spins Awarded!`;
      case 'instant': return `${reward.mult}× Your Bet Instantly!`;
      case 'jackpot': return 'PROGRESSIVE JACKPOT WON!';
      default: return 'Bonus Awarded!';
    }
  },

  awardWheelReward(reward) {
    let amount = 0;
    switch (reward.type) {
      case 'freespins':
        this.state.freeSpins += reward.count;
        this.state.freeSpinsTotal += reward.count;
        this.showResult(`🎁 ${reward.count} FREE SPINS!`, 'feature');
        break;
      case 'instant':
        amount = Math.round(this.state.totalBet * reward.mult);
        this.state.balance += amount;
        this.state.totalWon += amount;
        this.updateBalanceDisplay();
        window.updateBal?.(this.state.balance);
        break;
      case 'jackpot':
        // Call jackpot win
        this.triggerJackpot();
        break;
    }
  },

  // ── PICK ME BONUS ───────────────────────────────────────────
  getPickMeHTML() {
    return `
      <div class="bonus-modal pickme-bonus">
        <div class="bonus-header">
          <h3>🗿 PICK YOUR PRIZE</h3>
          <div class="picks-left">PICKS: <span id="picksLeft">3</span></div>
        </div>
        <div class="pickme-grid" id="pickmeGrid"></div>
        <div class="pickme-reveal" id="pickmeReveal" style="display:none"></div>
      </div>
    `;
  },

  async runPickMeBonus(config) {
    const grid = document.getElementById('pickmeGrid');
    const prizes = [...config.prizes];
    const positions = Array.from({ length: config.grid * config.grid }, (_, i) => i);
    const revealed = new Set();
    let picksLeft = config.picks;
    let totalWin = 0;

    // Shuffle prizes into positions
    const shuffled = [...prizes];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const prizeMap = {};
    positions.forEach((pos, i) => prizeMap[pos] = shuffled[i] || { type: 'mult', value: 5, label: '5×' });

    grid.innerHTML = positions.map(pos => `
      <button class="pickme-item" data-pos="${pos}">
        <div class="pickme-icon">❓</div>
        <div class="pickme-text">PICK ME</div>
      </button>
    `).join('');

    grid.querySelectorAll('.pickme-item').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (picksLeft <= 0 || btn.classList.contains('picked')) return;

        const pos = parseInt(btn.dataset.pos);
        const prize = prizeMap[pos];
        btn.classList.add('picked', 'revealing');

        await new Promise(r => setTimeout(r, 500));

        btn.innerHTML = `
          <div class="pickme-icon">${this.getPrizeIcon(prize)}</div>
          <div class="pickme-prize">${prize.label}</div>
        `;

        // Award prize
        const win = this.awardPickPrize(prize);
        totalWin += win;

        picksLeft--;
        document.getElementById('picksLeft').textContent = picksLeft;

        if (prize.type === 'collect') {
          // Collect all remaining
          const allPrizes = Object.values(prizeMap).filter((_, i) => !revealed.has(i));
          for (const p of allPrizes) {
            totalWin += this.awardPickPrize(p);
          }
          this.showResult(`💎 COLLECT ALL! +$${totalWin.toLocaleString()}`, 'jackpot');
          await new Promise(r => setTimeout(r, 2000));
          picksLeft = 0;
        }

        if (picksLeft <= 0) {
          setTimeout(() => {
            this.showResult(`🎁 BONUS COMPLETE! Total: +$${totalWin.toLocaleString()}`, 'bigwin');
            setTimeout(() => this.hideBonusOverlay(), 3000);
          }, 1000);
        }
      });
    });
  },

  getPrizeIcon(prize) {
    const icons = { mult: '✖️', freespins: '🔄', collect: '🧲', jackpot: '💎' };
    return icons[prize.type] || '💰';
  },

  awardPickPrize(prize) {
    let amount = 0;
    switch (prize.type) {
      case 'mult':
        amount = Math.round(this.state.totalBet * prize.value);
        break;
      case 'freespins':
        this.state.freeSpins += prize.value;
        this.state.freeSpinsTotal += prize.value;
        break;
    }
    if (amount > 0) {
      this.state.balance += amount;
      this.state.totalWon += amount;
      this.updateBalanceDisplay();
      window.updateBal?.(this.state.balance);
    }
    return amount;
  },

  // ── MONEY TRAIN BONUS ───────────────────────────────────────
  getMoneyTrainHTML() {
    return `
      <div class="bonus-modal moneytrain-bonus">
        <div class="bonus-header">
          <h3>🚂 MONEY TRAIN</h3>
          <div class="mt-info">
            <span>RESPINS: <span id="mtRespins">3</span></span>
            <span>TOTAL: $<span id="mtTotal">0</span></span>
          </div>
        </div>
        <div class="mt-grid" id="mtGrid"></div>
        <div class="mt-persistent" id="mtPersistent"></div>
      </div>
    `;
  },

  async runMoneyTrainBonus(config) {
    const grid = document.getElementById('mtGrid');
    const rows = 4, cols = 5;
    let respins = config.respins;
    let totalWin = 0;
    const persistent = [];
    const cells = Array(rows * cols).fill(null);

    // Initial trigger: 6+ money symbols
    let moneyCount = 6;
    for (let i = 0; i < moneyCount; i++) {
      const idx = Math.floor(Math.random() * cells.length);
      if (!cells[idx]) {
        const value = this.getRandomMoneyValue(config);
        cells[idx] = { type: 'money', value, sticky: true };
        totalWin += Math.round(this.state.totalBet * value);
      }
    }

    const render = () => {
      grid.innerHTML = cells.map((cell, i) => {
        if (!cell) return '<div class="mt-cell empty"></div>';
        if (cell.type === 'money') return `<div class="mt-cell money" data-value="${cell.value}">${cell.value}×</div>`;
        if (cell.type === 'special') return `<div class="mt-cell special ${cell.special}">${this.getSpecialIcon(cell.special)}</div>`;
        return '<div class="mt-cell empty"></div>';
      }).join('');

      document.getElementById('mtRespins').textContent = respins;
      document.getElementById('mtTotal').textContent = totalWin.toLocaleString();

      document.getElementById('mtPersistent').innerHTML = persistent.map(p => `
        <span class="mt-persist-badge ${p.type}">${this.getSpecialIcon(p.type)} ${p.type.toUpperCase()}</span>
      `).join('');
    };

    render();

    while (respins > 0) {
      await new Promise(r => setTimeout(r, 1000));

      // Spin
      let newSymbols = 0;
      for (let i = 0; i < cells.length; i++) {
        if (!cells[i] && Math.random() < 0.15) {
          const rand = Math.random();
          if (rand < 0.02) {
            // Special symbol
            const specials = Object.keys(config.specials);
            const special = specials[Math.floor(Math.random() * specials.length)];
            cells[i] = { type: 'special', special };
            if (config.specials[special].weight <= 2) persistent.push({ type: special, ...config.specials[special] });
          } else {
            const value = this.getRandomMoneyValue(config);
            cells[i] = { type: 'money', value, sticky: true };
            totalWin += Math.round(this.state.totalBet * value);
          }
          newSymbols++;
        }
      }

      if (newSymbols > 0) respins = config.respins;
      else respins--;

      // Execute specials
      cells.forEach((cell, i) => {
        if (cell?.type === 'special') {
          totalWin += this.executeSpecial(cell.special, cells, config);
          cells[i] = null; // Consume
        }
      });

      render();
    }

    // Award total
    this.state.balance += totalWin;
    this.state.totalWon += totalWin;
    this.updateBalanceDisplay();
    window.updateBal?.(this.state.balance);

    this.showResult(`🚂 MONEY TRAIN COMPLETE! +$${totalWin.toLocaleString()}`, 'jackpot');
    await new Promise(r => setTimeout(r, 3000));
  },

  getRandomMoneyValue(config) {
    const values = config.moneyValues;
    return values[Math.floor(Math.random() * values.length)];
  },

  getSpecialIcon(type) {
    const icons = { collector: '🧲', payer: '💸', sniper: '🎯', necromancer: '💀', persistent_collector: '🧲✨', persistent_payer: '💸✨' };
    return icons[type] || '✨';
  },

  executeSpecial(type, cells, config) {
    let totalWin = 0;
    const moneyCells = cells.map((c, i) => ({ cell: c, index: i })).filter(({ cell }) => cell?.type === 'money');

    switch (type) {
      case 'collector':
        moneyCells.forEach(({ cell }) => { totalWin += Math.round(this.state.totalBet * cell.value); cell.value = 0; });
        break;
      case 'payer':
        const add = this.getRandomMoneyValue(config);
        moneyCells.forEach(({ cell }) => cell.value += add);
        break;
      case 'sniper':
        if (moneyCells.length) {
          const target = moneyCells[Math.floor(Math.random() * moneyCells.length)];
          target.cell.value *= 2;
        }
        break;
      case 'necromancer':
        break;
    }
    return totalWin;
  },

  // ── UNLIMITED FREE SPINS (MEGAWAYS) ────────────────────────
  getUnlimitedFSHTML() {
    return `
      <div class="bonus-modal unlimited-fs">
        <div class="bonus-header">
          <h3>⚡ UNLIMITED FREE SPINS</h3>
          <div class="fs-stats">
            <span>SPINS: <span id="fsSpins">12</span></span>
            <span>MULT: <span id="fsMult">×1</span></span>
            <span>WIN: $<span id="fsWin">0</span></span>
          </div>
        </div>
        <div class="fs-reels" id="fsReels"></div>
        <button class="btn btn-primary btn-lg" id="fsSpinBtn">SPIN</button>
        <div class="fs-log" id="fsLog"></div>
      </div>
    `;
  },

  async runUnlimitedFreespins(config) {
    this.state.freeSpins = config.baseSpins;
    let multiplier = config.multiplierStart;
    let totalFSBonusWin = 0;

    const updateDisplay = () => {
      document.getElementById('fsSpins').textContent = this.state.freeSpins;
      document.getElementById('fsMult').textContent = `×${multiplier}`;
      document.getElementById('fsWin').textContent = totalFSBonusWin.toLocaleString();
    };

    updateDisplay();

    const spinBtn = document.getElementById('fsSpinBtn');
    spinBtn.addEventListener('click', async () => {
      if (this.state.freeSpins <= 0) return;
      if (spinBtn.disabled) return;

      spinBtn.disabled = true;
      this.state.freeSpins--;
      this.playSound('spin');

      // Simulate spin
      const win = await this.simulateFreeSpin(config);
      totalFSBonusWin += Math.round(win * multiplier);
      multiplier += config.multiplierIncrease;

      if (win > 0) {
        this.playSound('win');
      }

      // Check retrigger
      if (Math.random() < 0.15) { // 15% chance per spin
        const extra = config.extraPerScatter;
        this.state.freeSpins += extra;
        this.addFSLog(`🔄 RETRIGGER! +${extra} SPINS`);
      }

      updateDisplay();

      if (this.state.freeSpins > 0) {
        spinBtn.disabled = false;
      } else {
        this.addFSLog(`🏁 FREE SPINS OVER! Total: $${totalFSBonusWin.toLocaleString()}`);
        setTimeout(() => {
          this.state.balance += totalFSBonusWin;
          this.state.totalWon += totalFSBonusWin;
          this.updateBalanceDisplay();
          window.updateBal?.(this.state.balance);
          this.showResult(`⚡ UNLIMITED FS COMPLETE! +$${totalFSBonusWin.toLocaleString()}`, 'jackpot');
          setTimeout(() => this.hideBonusOverlay(), 3000);
        }, 1000);
      }
    });
  },

  async simulateFreeSpin(config) {
    // Simplified - return random win
    return Math.random() * this.state.totalBet * 20;
  },

  addFSLog(msg) {
    const log = document.getElementById('fsLog');
    if (log) log.innerHTML += `<div class="fs-log-entry">${msg}</div>`;
  },

  // ── MAP BONUS ───────────────────────────────────────────────
  getMapBonusHTML() {
    return `
      <div class="bonus-modal map-bonus">
        <div class="bonus-header">
          <h3>🗺️ TREASURE MAP</h3>
          <div class="map-pos">POSITION: <span id="mapPos">0</span>/25</div>
        </div>
        <div class="map-grid" id="mapGrid"></div>
        <button class="btn btn-primary btn-lg" id="mapRollBtn">ROLL DICE</button>
        <div class="map-log" id="mapLog"></div>
      </div>
    `;
  },

  async runMapBonus(config) {
    let position = 0;
    const grid = document.getElementById('mapGrid');

    // Create 5x5 grid
    grid.innerHTML = Array(25).fill(0).map((_, i) => `
      <div class="map-tile ${i === 0 ? 'current' : ''}" data-pos="${i}">
        ${config.prizes[i] ? `<span class="map-prize">${config.prizes[i].label}</span>` : ''}
      </div>
    `).join('');

    document.getElementById('mapRollBtn').addEventListener('click', async () => {
      const btn = document.getElementById('mapRollBtn');
      btn.disabled = true;

      const roll = Math.floor(Math.random() * 6) + 1;
      this.addMapLog(`🎲 Rolled: ${roll}`);

      // Animate movement
      for (let step = 1; step <= roll; step++) {
        position = Math.min(position + 1, 24);
        this.updateMapPosition(position);
        await new Promise(r => setTimeout(r, 200));
      }

      // Check tile
      const prize = config.prizes[position];
      if (prize) {
        this.awardMapPrize(prize);
      } else if (Math.random() < 0.15) {
        // Trap
        this.addMapLog(`💀 TRAP! Bonus ends.`);
        btn.disabled = false;
        await new Promise(r => setTimeout(r, 1000));
        this.showResult(`💀 TRAPPED! Bonus over.`, 'lose');
        await new Promise(r => setTimeout(r, 2000));
        this.hideBonusOverlay();
        return;
      }

      if (position >= 24) {
        this.addMapLog(`🏆 REACHED THE END!`);
        this.awardMapPrize(config.prizes[24] || { type: 'jackpot' });
        await new Promise(r => setTimeout(r, 2000));
        this.hideBonusOverlay();
        return;
      }

      btn.disabled = false;
    });
  },

  updateMapPosition(pos) {
    document.querySelectorAll('.map-tile').forEach((t, i) => {
      t.classList.toggle('current', i === pos);
      t.classList.toggle('visited', i < pos);
    });
    document.getElementById('mapPos').textContent = pos;
  },

  awardMapPrize(prize) {
    this.addMapLog(`🎁 ${prize.label} AWARDED!`);
    if (prize.type === 'mult') {
      const amount = Math.round(this.state.totalBet * prize.value);
      this.state.balance += amount;
      this.state.totalWon += amount;
      this.updateBalanceDisplay();
      window.updateBal?.(this.state.balance);
    } else if (prize.type === 'freespins') {
      this.state.freeSpins += prize.value;
      this.state.freeSpinsTotal += prize.value;
    } else if (prize.type === 'jackpot') {
      this.triggerJackpot();
    }
  },

  addMapLog(msg) {
    const log = document.getElementById('mapLog');
    if (log) log.innerHTML += `<div>${msg}</div>`;
  },

  // ── EXPANDING WILD FREE SPINS ───────────────────────────────
  getExpandingWildFSHTML() {
    return `
      <div class="bonus-modal ewfs-bonus">
        <div class="bonus-header">
          <h3>👑 PHARAOH'S FREE SPINS</h3>
          <div class="fs-stats">
            <span>SPINS: <span id="ewfsSpins">10</span></span>
            <span>WILD REELS: <span id="ewfsWilds">0</span></span>
            <span>WIN: $<span id="ewfsWin">0</span></span>
          </div>
        </div>
        <div class="ewfs-reels" id="ewfsReels"></div>
        <button class="btn btn-primary btn-lg" id="ewfsSpinBtn">SPIN</button>
      </div>
    `;
  },

  async runExpandingWildFS(config) {
    let spins = config.spins;
    let wildReels = new Set();
    let totalWin = 0;

    const spinBtn = document.getElementById('ewfsSpinBtn');
    spinBtn.addEventListener('click', async () => {
      if (spins <= 0 || spinBtn.disabled) return;
      spinBtn.disabled = true;
      spins--;
      document.getElementById('ewfsSpins').textContent = spins;

      this.playSound('spin');

      // Random expanding wilds
      if (config.expandingWild && Math.random() < 0.4) {
        const reel = Math.floor(Math.random() * 5);
        wildReels.add(reel);
        document.getElementById('ewfsWilds').textContent = wildReels.size;
      }

      // Symbol upgrade
      if (config.upgradeSymbol && Math.random() < 0.2) {
        this.showResult('📜 SYMBOL UPGRADED!', 'feature');
      }

      // Simulate win
      const win = await this.simulateFreeSpin(config);
      totalWin += win * (wildReels.size > 0 ? 2 : 1);
      document.getElementById('ewfsWin').textContent = totalWin.toLocaleString();

      if (win > 0) this.playSound('win');

      if (spins > 0) {
        spinBtn.disabled = false;
      } else {
        // Gamble feature
        if (config.gamble) {
          const gamble = confirm(`FREE SPINS OVER! Won $${totalWin.toLocaleString()}. Gamble for double? (${config.gamble.maxDouble}× max)`);
          if (gamble) {
            const won = Math.random() < 0.5;
            if (won) {
              totalWin *= 2;
              this.showResult(`🎲 GAMBLE WON! $${totalWin.toLocaleString()}`, 'jackpot');
            } else {
              totalWin = 0;
              this.showResult(`💀 GAMBLE LOST!`, 'lose');
            }
          }
        }
        this.state.balance += totalWin;
        this.state.totalWon += totalWin;
        this.updateBalanceDisplay();
        window.updateBal?.(this.state.balance);
        this.showResult(`👑 PHARAOH'S BLESSING! +$${totalWin.toLocaleString()}`, 'jackpot');
        await new Promise(r => setTimeout(r, 3000));
        this.hideBonusOverlay();
      }
    });
  },

  // ── JACKPOT ──────────────────────────────────────────────────
  triggerJackpot() {
    const game = this.state.currentGame;
    const jackpotWin = Math.round(this.state.totalBet * game.maxMult * 0.1); // Mini jackpot
    this.state.balance += jackpotWin;
    this.state.totalWon += jackpotWin;
    this.updateBalanceDisplay();
    window.updateBal?.(this.state.balance);
    this.showResult(`💎 JACKPOT! +$${jackpotWin.toLocaleString()}`, 'jackpot');
    this.playSound('jackpot');
    this.triggerParticles('jackpot');
  },

  // ── UTILITY ──────────────────────────────────────────────────
  showResult(msg, type) {
    const banner = document.getElementById('resultBanner');
    if (banner) {
      banner.textContent = msg;
      banner.className = `result-banner ${type}`;
    }
  },

  hideResultBanner() {
    const banner = document.getElementById('resultBanner');
    if (banner) banner.className = 'result-banner idle';
  },

  setSpinButtonState(spinning) {
    const btn = document.getElementById('btnSpin');
    if (btn) {
      btn.disabled = spinning;
      btn.querySelector('.spin-text').textContent = spinning ? 'SPINNING...' : 'SPIN';
    }
  },

  updateAutoSpinDisplay() {
    const btn = document.getElementById('btnAuto');
    if (btn) {
      if (this.state.autoSpins > 0) {
        btn.classList.add('active');
        btn.innerHTML = `🛑 Stop Auto (${this.state.autoSpins})`;
      } else {
        btn.classList.remove('active');
        btn.innerHTML = `🎯 Auto Spin`;
      }
    }
  },

  updateSessionStats() {
    const stats = {
      'statSpins': this.state.sessionSpins,
      'statWagered': this.state.totalWagered,
      'statWon': this.state.totalWon,
      'statNet': this.state.totalWon - this.state.totalWagered,
      'statBigWin': Math.max(this.state.bigWin || 0, this.state.lastWin),
    };
    Object.entries(stats).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = typeof val === 'number' ? (val >= 0 && id === 'statNet' ? '+' : '') + val.toLocaleString() : val;
    });
    if (el = document.getElementById('statNet')) {
      el.className = 'stat-value ' + (this.state.totalWon >= this.state.totalWagered ? 'positive' : 'negative');
    }
  },

  triggerParticles(type) {
    const emojis = {
      win: ['💰', '✨', '💎', '⭐'],
      bigwin: ['💎', '💰', '🏆', '⭐', '🎉'],
      jackpot: ['💎', '🏆', '💰', '✨', '🌟', '🎊', '🔥'],
    };
    const container = document.getElementById('particleContainer') || document.body;
    const list = emojis[type] || emojis.win;
    for (let i = 0; i < (type === 'jackpot' ? 40 : 15); i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.textContent = list[Math.floor(Math.random() * list.length)];
      p.style.cssText = `left:50%;top:50%;--tx:${(Math.random()-0.5)*400}px;--ty:${(Math.random()-0.5)*400}px;`;
      container.appendChild(p);
      setTimeout(() => p.remove(), 1100);
    }
  },

  showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    toast.style.cssText = `position:fixed;bottom:80px;right:20px;z-index:500;padding:12px 20px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rad-md);box-shadow:var(--shadow-lg);animation:slideInRight 0.3s ease;`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideOutRight 0.2s ease forwards'; setTimeout(() => toast.remove(), 200); }, 3000);
  },

  restoreSession() {
    const saved = localStorage.getItem(`slots_${this.state.currentGame.id}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.freeSpins > 0) {
          this.state.freeSpins = data.freeSpins;
          this.state.freeSpinsTotal = data.freeSpinsTotal;
          this.showResult(`🎁 ${data.freeSpins} FREE SPINS RESTORED!`, 'feature');
        }
      } catch (e) {}
    }
  },

  saveSession() {
    const data = {
      freeSpins: this.state.freeSpins,
      freeSpinsTotal: this.state.freeSpinsTotal,
      bonusMode: this.state.bonusMode,
    };
    localStorage.setItem(`slots_${this.state.currentGame.id}`, JSON.stringify(data));
  },

  // ── UI SETUP ─────────────────────────────────────────────────
  setupUI() {
    const game = this.state.currentGame;

    // Update game title
    const gameTitle = document.getElementById('gameTitle');
    if (gameTitle) gameTitle.textContent = game.name;
    const gameIcon = document.getElementById('gameIcon');
    if (gameIcon) gameIcon.textContent = game.icon;
    const gameTypeBadge = document.getElementById('gameTypeBadge');
    if (gameTypeBadge) gameTypeBadge.textContent = game.type.toUpperCase();

    // Bet controls
    const betInput = document.getElementById('betInput');
    if (betInput) {
      betInput.min = game.minBet;
      betInput.max = game.maxBet;
      betInput.value = this.state.bet;
    }

    // Quick bets
    document.querySelectorAll('.bet-quick-btn').forEach(btn => {
      const val = parseInt(btn.dataset.bet);
      if (val >= game.minBet && val <= game.maxBet) {
        btn.style.display = 'inline-flex';
      } else {
        btn.style.display = 'none';
      }
    });

    // Lines (for non-megaways)
    if (game.type !== 'megaways') {
      const linesInput = document.getElementById('linesInput');
      if (linesInput) {
        linesInput.max = game.paylines;
        linesInput.value = this.state.lines;
      }
    } else {
      document.getElementById('linesRow')?.style.setProperty('display', 'none');
    }

    // Build reels
    this.buildReels();

    // Event listeners
    this.bindEvents();
  },

  buildReels() {
    const game = this.state.currentGame;
    const container = document.querySelector('.reels-container');
    if (!container) return;

    const rows = game.rows || 3;
    const reels = game.reels;

    container.innerHTML = '';
    container.style.cssText = `--reel-count: ${reels}; --row-count: ${rows};`;

    for (let r = 0; r < reels; r++) {
      const reel = document.createElement('div');
      reel.className = `reel reel-${game.type}`;
      reel.dataset.reel = r;
      reel.innerHTML = `
        <div class="reel-frame">
          <div class="reel-strip" id="strip${r}"></div>
          <div class="payline-overlay" id="paylines${r}"></div>
          <div class="win-layer" id="winlayer${r}"></div>
        </div>
      `;
      container.appendChild(reel);
    }

    // Initial symbols
    this.getInitialVisibleSymbols();
    this.renderReels();
  },

  bindEvents() {
    // Spin button
    document.getElementById('btnSpin')?.addEventListener('click', () => this.spin());

    // Auto spin
    document.getElementById('btnAuto')?.addEventListener('click', () => {
      if (this.state.autoSpins > 0) {
        this.state.autoSpins = 0;
      } else {
        this.state.autoSpins = 100;
        this.spin();
      }
      this.updateAutoSpinDisplay();
    });

    // Turbo
    document.getElementById('btnTurbo')?.addEventListener('click', (e) => {
      this.state.turbo = !this.state.turbo;
      e.target.classList.toggle('active', this.state.turbo);
    });

    // Bet input
    document.getElementById('betInput')?.addEventListener('change', (e) => {
      const game = this.state.currentGame;
      let val = parseInt(e.target.value) || game.minBet;
      val = Math.max(game.minBet, Math.min(game.maxBet, val));
      this.state.bet = val;
      this.state.totalBet = this.state.bet * this.state.lines;
      e.target.value = val;
      const spinCost1 = document.getElementById('spinCost');
      if (spinCost1) spinCost1.textContent = this.state.totalBet.toLocaleString();
    });

    // Quick bets
    document.querySelectorAll('.bet-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.bet);
        this.state.bet = val;
        this.state.totalBet = this.state.bet * this.state.lines;
        const betInput = document.getElementById('betInput');
        if (betInput) betInput.value = val;
        const spinCost2 = document.getElementById('spinCost');
        if (spinCost2) spinCost2.textContent = this.state.totalBet.toLocaleString();
        document.querySelectorAll('.bet-quick-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Lines
    document.getElementById('linesInput')?.addEventListener('change', (e) => {
      const game = this.state.currentGame;
      let val = parseInt(e.target.value) || 1;
      val = Math.max(1, Math.min(game.paylines, val));
      this.state.lines = val;
      this.state.totalBet = this.state.bet * this.state.lines;
      const spinCost3 = document.getElementById('spinCost');
      if (spinCost3) spinCost3.textContent = this.state.totalBet.toLocaleString();
    });

    // Feature buy
    document.getElementById('btnBuyFeature')?.addEventListener('click', () => this.buyFeature());

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); this.spin(); }
      if (e.code === 'KeyA') this.toggleAutoSpin();
      if (e.code === 'KeyT') this.toggleTurbo();
    });

    // Save session on unload
    window.addEventListener('beforeunload', () => this.saveSession());
  },

  toggleAutoSpin() {
    if (this.state.autoSpins > 0) {
      this.state.autoSpins = 0;
    } else {
      this.state.autoSpins = 100;
      this.spin();
    }
    this.updateAutoSpinDisplay();
  },

  toggleTurbo() {
    this.state.turbo = !this.state.turbo;
    document.getElementById('btnTurbo')?.classList.toggle('active', this.state.turbo);
  },

  async buyFeature() {
    const game = this.state.currentGame;
    const cost = this.state.totalBet * 100; // 100x bet

    if (this.state.balance < cost) {
      this.showToast('Insufficient balance for feature buy', 'error');
      return;
    }

    if (!confirm(`Buy bonus feature for $${cost.toLocaleString()}?`)) return;

    this.state.balance -= cost;
    this.state.totalWagered += cost;
    this.updateBalanceDisplay();
    window.updateBal?.(this.state.balance);

    this.showResult('🎁 FEATURE PURCHASED!', 'feature');
    await new Promise(r => setTimeout(r, 500));
    await this.triggerBonus('buy');
  },
};

// Export for use in slots.js
window.SLOTS_ENGINE = SLOTS_ENGINE;