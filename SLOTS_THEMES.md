# Slot Themes: Neon Nights, Treasure Quest, Pharaoh's Riches

This document details three full-featured slot game drafts including rules, payouts, sounds, UI suggestions, and asset lists. Use these as Blueprints to implement DraftKings-style slots.

---

## 1) Neon Nights (High Volatility)

- Theme: Futuristic neon-lit city nightlife.
- Reels: 3x3, classic feel but with big jackpots.
- Min/Max Bet: $1 / $500
- RTP Target: ~94%
- Volatility: High

Symbols & Payouts:
- 💎 (Jackpot) — 3x pays 50x
- ★ (Scatter / Free Spins) — 3x pays 25x + triggers free spins
- 🎧 — 12x
- 🕶️ — 10x
- 🌃 — 8x
- 🔋 (Wild) — substitutes and gives small multiplier
- 🧊 — 5x

Special Features:
- Wild (🔋) substitutes for other symbols and doubles certain wins when part of a 3-of-kind.
- Scatter (★) 3+ → 8 free spins with 2x multiplier during free spins.
- Random jackpot chance on each spin (low-probability additional multiplicative payout).

Sounds & Assets:
- Spin: `neon_spin.mp3`
- Small Win: `neon_win.mp3`
- Big Win: `neon_big.mp3`
- Bonus Trigger: `neon_bonus.mp3`
- Visuals: neon animated background, lens flares, animated symbol glows.

UI Notes:
- Big central payline highlight when win occurs.
- Flashing neon borders for big wins and free spins.

---

## 2) Treasure Quest (Medium Volatility)

- Theme: Pirate treasure hunt, maps, chests and sea storms.
- Reels: 5x3 modern layout, paylines implemented server-side or client-side.
- Min/Max Bet: $1 / $250
- RTP Target: ~96%
- Volatility: Medium

Symbols & Payouts:
- 💰 (Treasure Chest) — 3x pays 40x
- 🪙 (Gold Coin) — 3x pays 20x
- 🗺️ (Map / Scatter) — 3+ triggers 10 free spins
- 🏴‍☠️ (Wild) — substitutes and can be stacked
- ⚓, 🦜, 🔑 — lower payouts

Special Features:
- Stacked Wilds: Wild symbol can appear stacked on reels 2-4 during base game.
- Scatter Free Spins: 3+ maps → 10 free spins with respins on stacked wilds.
- Respin mechanic: If stacked wilds appear, trigger a respin with sticky wilds.

Sounds & Assets:
- Spin: `treasure_spin.mp3`
- Win: `treasure_win.mp3`
- Big Win: `treasure_big.mp3`
- Bonus: `treasure_bonus.mp3`
- Visuals: parallax ocean backgrounds, animated treasure chest opening.

UI Notes:
- Show map progression for bonus round.
- Chest pick UI for bonus picks (if implemented).

---

## 3) Pharaoh's Riches (Low Volatility)

- Theme: Ancient Egypt, tombs, sarcophagi, gold relics.
- Reels: 5x3 modern layout.
- Min/Max Bet: $1 / $200
- RTP Target: ~97.5%
- Volatility: Low (frequent small wins)

Symbols & Payouts:
- 👑 (Pharaoh Wild) — high-value wildcard, expanding on win
- 🔺 — 3x pays 18x
- 🪆 — 12x
- 🦂 — 10x
- 📜 (Scatter) — triggers Mystery Chest bonus
- 🪙, 🪨 — small payouts

Special Features:
- Expanding Wilds: When wild completes a win, it expands to cover the reel.
- Mystery Chest Bonus: 3+ scatters give a pick-3 chest bonus with coins/multipliers.
- Many small wins to keep player engaged.

Sounds & Assets:
- Spin: `pharaoh_spin.mp3`
- Win: `pharaoh_win.mp3`
- Big Win: `pharaoh_big.mp3`
- Bonus: `pharaoh_bonus.mp3`
- Visuals: hieroglyph-etched UI, sand particle effects, golden shimmer on big wins.

UI Notes:
- Emphasize coin rain animation for wins.
- Smooth transitions for expanding wilds.

---

## Implementation Notes

- Server: `supabase/functions/place-bet/index.ts` now includes symbol sets and payout tables for these three themes. The current server logic pays 3-of-a-kind wins using the `payouts` table; advanced features (wild substitution, scatters, free spins, expanding wilds) require additional server-side handling or can be handled client-side for demo purposes.

- Client: `js/slots-themes.js` contains metadata, RTP targets, recommended sounds and UI labels. Use this file to render paytables and bind sound assets.

- Assets: Add sound files to `js/sounds/` or `sounds/` folder and wire them into your existing `sounds.js` loader.

- Testing: Simulate 100k spins per theme locally to approximate RTP and volatility. Adjust payout multipliers to reach RTP targets.

---

## Next Steps

1. Wire up sound files listed in `js/slots-themes.js` and add assets.
2. Implement server-side handling for scatters/free-spins if you want provably-fair server authority.
3. Create themed HTML/CSS skins or a single slots page with theme selector.
4. Run RTP simulations and tune payout tables until target RTP is achieved.

If you want, I can now implement one fully server-authoritative feature (e.g., Neon's scatter free-spins) and wire it into the Edge function. Which theme should I prioritize for full feature implementation? 
