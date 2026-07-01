# Project Review + Fix Implementation TODO

## Plan approved by user: implement highest-priority fixes and run thorough testing

- [x] Read core project files and identify issues
- [x] Confirm testing scope with user (full/thorough)

## Critical fixes to implement
- [ ] Fix API/client consistency for crash game outcome verification in `pages/crash.html`
- [ ] Fix icons mapping for feed/history/leaderboard to include crash/mines where missing
- [ ] Add robust async error handling in gameplay actions (coin, dice, slots, crash, mines)
- [ ] Harden `apiPlaceBet` in `js/shared.js` against network/JSON parse failures
- [ ] Ensure mines flow handles impossible/invalid states defensively
- [ ] Fix mines provably-fair verification mismatch (mines-aware outcome comparison)
- [ ] Update history verify modal logic for mines-aware verification

## Thorough testing
- [x] Backend/API checks (happy paths + edge/error paths for place-bet)
- [ ] Backend/API checks for verify-bet deployment + endpoint scenarios
- [ ] Frontend page-level checks for all pages in `pages/` via browser interactions
- [ ] Integration checks: balance consistency, nonce progression, provably fair parity

## New user-requested fixes
- [x] Fix mines gameplay so picks can lose and cashout is consistently usable
- [x] Make client seed/provably-fair info easier to understand on each game page

## User-requested documentation
- [ ] Create a new summary file listing all additions/fixes made so far

## Finalize
- [ ] Summarize fixes, test results, and remaining recommendations
