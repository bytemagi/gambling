// slots-themes.js — Client-side metadata for themed slot games
// Used by the frontend to render paytables, sounds, and UI labels

export const SLOT_THEMES = {
  neon: {
    id: 'neon',
    title: 'Neon Nights',
    description: 'High-volatility city-night slot. Big jackpots and scatter-activated free spins.',
    reels: 3,
    rows: 3,
    minBet: 1,
    maxBet: 500,
    rtp: 0.94,
    volatility: 'High',
    symbols: ['🕶️','🌃','💎','🎧','🔋','🧊','★'],
    wild: '🔋',
    scatter: '★',
    bonus: {
      freeSpinsOn: 3, // scatters needed
      freeSpins: 8,
      freeSpinMultiplier: 2
    },
    payouts: {
      '💎': 50,
      '★': 25,
      '🎧': 12,
      '🕶️': 10,
      '🌃': 8,
      '🔋': 6,
      '🧊': 5
    },
    sounds: {
      spin: 'neon_spin.mp3',
      win: 'neon_win.mp3',
      bigWin: 'neon_big.mp3',
      bonus: 'neon_bonus.mp3'
    }
  },

  treasure: {
    id: 'treasure',
    title: 'Treasure Quest',
    description: 'Mid-volatility pirate slot with scatter bonus and stacked symbols.',
    reels: 5,
    rows: 3,
    minBet: 1,
    maxBet: 250,
    rtp: 0.96,
    volatility: 'Medium',
    symbols: ['🏴‍☠️','🗺️','🪙','💰','⚓','🦜','🔑'],
    wild: '🏴‍☠️',
    scatter: '🗺️',
    bonus: {
      freeSpinsOn: 3,
      freeSpins: 10,
      respinOnStack: true
    },
    payouts: {
      '💰': 40,
      '🪙': 20,
      '🗺️': 12,
      '🏴‍☠️': 10,
      '⚓': 8,
      '🦜': 6,
      '🔑': 5
    },
    sounds: {
      spin: 'treasure_spin.mp3',
      win: 'treasure_win.mp3',
      bigWin: 'treasure_big.mp3',
      bonus: 'treasure_bonus.mp3'
    }
  },

  pharaoh: {
    id: 'pharaoh',
    title: "Pharaoh's Riches",
    description: 'Lower volatility with expanding wilds, many small wins and a mystery chest bonus.',
    reels: 5,
    rows: 3,
    minBet: 1,
    maxBet: 200,
    rtp: 0.975,
    volatility: 'Low',
    symbols: ['🪙','📜','🦂','🪆','👑','🔺','🪨'],
    wild: '👑',
    scatter: '📜',
    bonus: {
      chestOn: 3,
      chestPicks: 3
    },
    payouts: {
      '👑': 30,
      '🔺': 18,
      '🪆': 12,
      '🦂': 10,
      '📜': 8,
      '🪙': 6,
      '🪨': 4
    },
    sounds: {
      spin: 'pharaoh_spin.mp3',
      win: 'pharaoh_win.mp3',
      bigWin: 'pharaoh_big.mp3',
      bonus: 'pharaoh_bonus.mp3'
    }
  }
};

export default SLOT_THEMES;
