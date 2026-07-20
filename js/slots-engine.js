// slots-engine.js — Slot engine driven by the server's authoritative, provably-fair outcome.
// The backend place-bet function returns outcome (3 symbols), win, delta, and the post-bet balance.
// This engine only renders that outcome and syncs state from it.

const SLOTS_ENGINE = {
  // ── GAME CONFIGURATIONS ──────────────────────────────────────
  // Symbols must match backend SLOT_GAME_CONFIGS and provably-fair SLOT_SYMBOLS exactly.
  GAMES: {
    classic: {
      id: 'classic', name: 'Classic 7s', icon: '🎰', category: 'classic',
      rtp: 96.5, volatility: 'Medium', minBet: 1, maxBet: 500,
      symbols: ['🍒','🍋','🍊','⭐','💎','7️⃣'],
      payouts: { '💎': 20, '7️⃣': 10, '⭐': 5, '🍒': 5 },
    },
    fruit: {
      id: 'fruit', name: 'Fruit Fiesta', icon: '🍒', category: 'video',
      rtp: 96.2, volatility: 'Low', minBet: 1, maxBet: 1000,
      symbols: ['🍒','🍋','🍊','🍉','🍇','🍌'],
      payouts: { '🍇': 15, '🍉': 10, '🍊': 8, '🍋': 6, '🍌': 5, '🍒': 5 },
    },
    diamond: {
      id: 'diamond', name: 'Diamond Rush', icon: '💎', category: 'progressive',
      rtp: 95.8, volatility: 'High', minBet: 5, maxBet: 2000,
      symbols: ['💎','⭐','🌟','✨','💫','🔥'],
      payouts: { '💎': 25, '🔥': 15, '💫': 10, '✨': 8, '🌟': 6, '⭐': 5 },
    },
    wild: {
      id: 'wild', name: 'Wild West Gold', icon: '🤠', category: 'video',
      rtp: 96.0, volatility: 'High', minBet: 1, maxBet: 1000,
      symbols: ['🤠','⭐','🦬','🌵','💰','🔫'],
      payouts: { '🤠': 20, '💰': 15, '🦬': 10, '⭐': 8, '🌵': 6, '🔫': 5 },
    },
    neon: {
      id: 'neon', name: 'Neon Nights', icon: '🌃', category: 'video',
      rtp: 96.1, volatility: 'High', minBet: 1, maxBet: 500,
      symbols: ['🕶️','🌃','💎','🎧','🔋','🧊','★'],
      payouts: { '💎': 50, '★': 25, '🎧': 12, '🕶️': 10, '🌃': 8, '🔋': 6, '🧊': 5 },
    },
    megaways: {
      id: 'megaways', name: 'Megaways Madness', icon: '⚡', category: 'megaways',
      rtp: 96.1, volatility: 'Very High', minBet: 1, maxBet: 500,
      symbols: ['🕶️','🌃','💎','🎧','🔋','🧊','⚡','★'],
      payouts: { '⚡': 50, '💎': 25, '★': 15, '🎧': 10, '🕶️': 8, '🌃': 6, '🔋': 5, '🧊': 4 },
    },
    treasure: {
      id: 'treasure', name: 'Treasure Quest', icon: '🏴‍☠️', category: 'video',
      rtp: 96.3, volatility: 'Medium-High', minBet: 1, maxBet: 1000,
      symbols: ['🏴‍☠️','🗺️','🪙','💰','⚓','🦜','🔑'],
      payouts: { '💰': 40, '🪙': 20, '🗺️': 12, '🏴‍☠️': 10, '⚓': 8, '🦜': 6, '🔑': 5 },
    },
    pharaoh: {
      id: 'pharaoh', name: "Pharaoh's Riches", icon: '👑', category: 'video',
      rtp: 95.9, volatility: 'High', minBet: 1, maxBet: 1000,
      symbols: ['🪙','📜','🦂','🪆','👑','🔺','🪨'],
      payouts: { '👑': 30, '🔺': 18, '🪆': 12, '🦂': 10, '📜': 8, '🪙': 6, '🪨': 4 },
    },
    megalodon: {
      id: 'megalodon', name: 'Megalodon', icon: '🦈', category: 'progressive',
      rtp: 95.5, volatility: 'Extreme', minBet: 1, maxBet: 500,
      symbols: ['⭐','🪸','🤿','💰','🪼','🐙','🦈','🔱'],
      payouts: { '🦈': 50, '🔱': 40, '🐙': 20, '🪼': 12, '💰': 10, '🤿': 8, '🪸': 6, '⭐': 4 },
    },
  },

  // ── STATE ────────────────────────────────────────────────────
  state: {
    currentGame: null,
    balance: 0,
    bet: 1,
    spinning: false,
    totalWon: 0,
    totalWagered: 0,
    sessionSpins: 0,
    lastWin: 0,
    bigWin: 0,
    lastOutcome: null,
    lastResult: null,
  },

  playSound(name) {
    if (window.playSound) window.playSound(name);
  },

  // ── INITIALIZATION ──────────────────────────────────────────
  async init(gameId) {
    const game = this.GAMES[gameId];
    if (!game) throw new Error(`Game ${gameId} not found`);

    this.state.currentGame = game;
    this.state.bet = game.minBet;

    this.setupUI();
    await this.loadBalance();
    this.restoreSession();

    console.log(`🎰 ${game.name} initialized`);
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
    if (spinCostEl) spinCostEl.textContent = '$' + this.state.totalBet().toLocaleString();
  },

  totalBet() {
    return this.state.bet;
  },

  // ── UI SETUP ─────────────────────────────────────────────────
  setupUI() {
    const game = this.state.currentGame;

    // Update game title / badge
    const gameTitle = document.getElementById('gameTitle');
    if (gameTitle) gameTitle.textContent = game.name;
    const gameIcon = document.getElementById('gameIcon');
    if (gameIcon) gameIcon.textContent = game.icon;
    const gameTypeBadge = document.getElementById('gameTypeBadge');
    if (gameTypeBadge) gameTypeBadge.textContent = game.category.toUpperCase();

    // Info bar
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('infoRTP', game.rtp + '%');
    set('infoVol', game.volatility);
    set('infoMaxWin', '500×');
    set('infoLines', '3');

    // Progressive jackpot bar only for progressive games
    const jackpotBar = document.getElementById('jackpotBar');
    if (jackpotBar) jackpotBar.style.display = game.category === 'progressive' ? '' : 'none';

    // Bet input bounds
    const betInput = document.getElementById('betInput');
    if (betInput) {
      betInput.min = game.minBet;
      betInput.max = game.maxBet;
      betInput.value = this.state.bet;
    }

    // Build the 3 reels (1 visible row each)
    this.buildReels();

    // Event listeners
    this.bindEvents();
  },

  buildReels() {
    const container = document.querySelector('.reels-container');
    if (!container) return;
    container.innerHTML = '';
    container.style.cssText = '--reel-count: 3; --row-count: 3;';

    for (let r = 0; r < 3; r++) {
      const reel = document.createElement('div');
      reel.className = 'reel';
      reel.dataset.reel = r;
      reel.innerHTML = `
        <div class="reel-frame">
          <div class="reel-strip" id="strip${r}">
            <div class="reel-symbol">${this.state.currentGame.symbols[r] || '🎰'}</div>
          </div>
        </div>`;
      container.appendChild(reel);
    }
  },

  bindEvents() {
    document.getElementById('spinBtn')?.addEventListener('click', () => this.spin());

    document.getElementById('betInput')?.addEventListener('change', (e) => {
      const game = this.state.currentGame;
      let val = parseInt(e.target.value) || game.minBet;
      val = Math.max(game.minBet, Math.min(game.maxBet, val));
      this.state.bet = val;
      e.target.value = val;
      this.updateBalanceDisplay();
    });

    document.querySelectorAll('.bet-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.bet);
        if (val < this.state.currentGame.minBet || val > this.state.currentGame.maxBet) return;
        this.state.bet = val;
        const betInput = document.getElementById('betInput');
        if (betInput) betInput.value = val;
        this.updateBalanceDisplay();
        document.querySelectorAll('.bet-quick-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    document.getElementById('clearHistory')?.addEventListener('click', () => {
      const list = document.getElementById('historyList');
      if (list) list.innerHTML = '';
    });

    document.getElementById('pfVerifyBtn')?.addEventListener('click', () => {
      const r = this.state.lastResult;
      if (!r) { this.showToast('Spin first to verify', 'info'); return; }
      // Hand off to provably-fair verify UI
      if (window.renderPFVerify) {
        window.renderPFVerify('pfVerifyResult', {
          serverSeed: r.serverSeed,
          serverSeedHash: r.serverSeedHash,
          clientSeed: r.clientSeed,
          nonce: r.nonce,
          game: 'slots',
          outcome: r.outcome,
          slotType: this.state.currentGame.id,
        });
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); this.spin(); }
    });

    window.addEventListener('beforeunload', () => this.saveSession());
  },

  // ── SPIN LOGIC ──────────────────────────────────────────────
  async spin() {
    if (this.state.spinning) return;

    const game = this.state.currentGame;
    const cost = this.state.bet;

    if (this.state.balance < cost) {
      this.showToast('Insufficient balance', 'error');
      return;
    }

    this.state.spinning = true;
    this.state.lastWin = 0;
    this.hideResultBanner();
    this.setSpinButtonState(true);
    this.playSound('spin');

    const clientSeed = getClientSeed();
    const nonce = incrementNonce();

    try {
      const result = await this.getServerResult(game.id, cost, clientSeed, nonce);

      // Animate reels to the authoritative outcome symbols
      await this.animateReelsToResult(result.outcome);

      // Sync balance from server (server already deducted bet & credited win)
      this.state.balance = result.balance;
      this.state.lastResult = result;
      this.state.lastOutcome = result.outcome;
      this.updateBalanceDisplay();
      window.updateBal?.(this.state.balance);

      // Track session stats
      this.state.sessionSpins++;
      this.state.totalWagered += cost;
      const win = Math.max(0, result.delta);
      if (win > 0) {
        this.state.totalWon += win;
        this.state.lastWin = win;
        this.state.bigWin = Math.max(this.state.bigWin, win);
      }
      this.updateSessionStats();

      // Show result + history
      this.showResultFromServer(result);
      addHistory(result.outcome, win > 0, false, cost, win);
    } catch (error) {
      console.error('Spin error:', error);
      this.showResult('Error: ' + (error.message || 'failed'), 'lose');
      this.playSound('lose');
      // refund optimistic? server did not deduct on error path for non-slots; for slots server throws 400 before deduct only if invalid. Keep balance as-is.
    } finally {
      this.state.spinning = false;
      this.setSpinButtonState(false);
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
        game: 'slots',
        amount: bet,
        choice: { gameType: gameId, clientSeed, nonce },
        clientSeed,
        nonce,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Server error');
    }

    return res.json();
  },

  // ── REEL ANIMATION ──────────────────────────────────────────
  async animateReelsToResult(outcome) {
    const duration = this.isTurbo() ? 400 : 1100;
    const symbols = this.state.currentGame.symbols;
    const reelEls = document.querySelectorAll('.reel .reel-strip');

    const promises = [];
    for (let r = 0; r < 3; r++) {
      const reelEl = reelEls[r];
      if (!reelEl) continue;
      promises.push(this.spinReelToTarget(reelEl, outcome[r], symbols, duration, r * 140));
    }
    await Promise.all(promises);
  },

  isTurbo() {
    const t = document.getElementById('turboToggle');
    return t ? t.checked : false;
  },

  spinReelToTarget(reelEl, targetSymbol, symbols, duration, delay) {
    return new Promise(resolve => {
      setTimeout(() => {
        const symbolHeight = reelEl.querySelector('.reel-symbol')?.offsetHeight
          || reelEl.clientHeight
          || 110;

        // Build a blur strip: random symbols scrolling, ending on targetSymbol.
        const overspin = 12;
        const blur = [];
        for (let i = 0; i < overspin; i++) {
          blur.push(symbols[Math.floor(Math.random() * symbols.length)]);
        }
        blur.push(targetSymbol);

        reelEl.style.transition = 'none';
        reelEl.style.transform = 'translateY(0)';
        reelEl.innerHTML = blur.map(s => `<div class="reel-symbol">${s}</div>`).join('');

        // Force reflow so the start position is applied before animating
        void reelEl.offsetHeight;

        const targetOffset = -(overspin * symbolHeight);
        reelEl.style.transition = `transform ${duration}ms cubic-bezier(0.15, 0.85, 0.35, 1)`;
        reelEl.style.transform = `translateY(${targetOffset}px)`;

        setTimeout(() => {
          // Snap to a clean single-symbol view on the target
          reelEl.style.transition = 'none';
          reelEl.style.transform = 'translateY(0)';
          reelEl.innerHTML = `<div class="reel-symbol" data-final="1">${targetSymbol}</div>`;
          resolve();
        }, duration);
      }, delay);
    });
  },

  // ── RESULT DISPLAY ──────────────────────────────────────────
  showResultFromServer(result) {
    const win = Math.max(0, result.delta);
    const outcome = result.outcome || [];
    const allSame = outcome.length === 3 && outcome[0] === outcome[1] && outcome[1] === outcome[2];

    // Highlight winning reel if 3 of a kind
    if (allSame) {
      document.querySelectorAll('.reel .reel-symbol').forEach(el => {
        if (el.textContent === outcome[0]) {
          el.classList.add('winning');
        }
      });
    }

    if (win > 0) {
      const mult = win / this.state.bet;
      if (mult >= 100) {
        this.showResult(`💎 MEGA WIN! +$${win.toLocaleString()}`, 'jackpot');
        this.playSound('jackpot');
        this.triggerParticles('jackpot');
      } else if (mult >= 20) {
        this.showResult(`🎉 BIG WIN! +$${win.toLocaleString()}`, 'bigwin');
        this.playSound('bigwin');
        this.triggerParticles('bigwin');
      } else {
        this.showResult(`✨ WIN! +$${win.toLocaleString()}`, 'win');
        this.playSound('win');
        this.triggerParticles('win');
      }
    } else {
      this.showResult('No win this spin', 'lose');
      this.playSound('lose');
    }
  },

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
    const btn = document.getElementById('spinBtn');
    if (btn) {
      btn.disabled = spinning;
      const txt = btn.querySelector('.spin-text');
      if (txt) txt.textContent = spinning ? 'SPINNING...' : 'SPIN';
    }
  },

  updateSessionStats() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('sessSpins', this.state.sessionSpins);
    set('sessWagered', '$' + this.state.totalWagered.toLocaleString());
    set('sessWon', '$' + this.state.totalWon.toLocaleString());
    set('sessNet', '$' + (this.state.totalWon - this.state.totalWagered).toLocaleString());
    set('sessBig', '$' + this.state.bigWin.toLocaleString());
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
    toast.style.cssText = 'position:fixed;bottom:80px;right:20px;z-index:500;padding:12px 20px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rad-md);box-shadow:var(--shadow-lg);animation:slideInRight 0.3s ease;';
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideOutRight 0.2s ease forwards'; setTimeout(() => toast.remove(), 200); }, 3000);
  },

  // ── SESSION PERSISTENCE ─────────────────────────────────────
  restoreSession() {
    const saved = localStorage.getItem(`slots_${this.state.currentGame.id}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.bet) this.state.bet = data.bet;
      } catch (e) {}
    }
  },

  saveSession() {
    localStorage.setItem(`slots_${this.state.currentGame.id}`, JSON.stringify({ bet: this.state.bet }));
  },
};

window.SLOTS_ENGINE = SLOTS_ENGINE;
