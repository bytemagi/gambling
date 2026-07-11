# TODO — Slots visual refactor (split CSS/JS + improve visuals)

## Step 1 — Extract styles
- [x] Create `css/slots.css` containing the slot-specific `<style>` from `pages/slots.html`
- [x] Remove the inline `<style>` from `pages/slots.html`
- [ ] Ensure CSS variables / selectors still apply correctly

## Step 2 — Extract game logic
- [x] Create `js/slots.js` containing the `<script>` logic from `pages/slots.html`
- [x] Ensure all functions referenced by HTML attributes are global:
  - `setQuickBet`, `halfBet`, `doubleBet`, `spin`
- [x] Remove inline `<script>` from `pages/slots.html` and replace with `<script src="../js/slots.js"></script>`

## Step 3 — Regression check
- [ ] Manually verify the slots page still spins, updates balance/history, and PF verification renders.

## Step 4 — Visual upgrades (next phase)
- [ ] Improve reel animations + glow/lighting
- [ ] Add win highlighting on specific reels
- [ ] Upgrade paytable + symbol art presentation
- [ ] Make layout more “casino-grade” and responsive

