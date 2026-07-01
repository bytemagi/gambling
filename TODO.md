# Project Review + Fix Implementation TODO

## Plan approved by user: implement highest-priority fixes and run thorough testing

- [x] Read core project files and identify issues
- [x] Confirm testing scope with user (full/thorough)

## High impact
- [ ] Deploy `verify-bet` edge function and wire a fallback path in UI if unavailable (`NOT_FOUND`)
- [ ] Centralize verification logic into one shared helper (avoid duplicate compare logic)
- [ ] Add try/catch around all async gameplay handlers (coin, dice, slots, crash, mines) with consistent user-facing error states
- [ ] Harden `apiPlaceBet` for network failures + non-JSON responses to prevent silent UI breaks

## Fairness / trust
- [ ] Persist and display pre-bet server seed hash before placing a bet, then reveal seed after settlement for stronger PF UX
- [ ] Add a “Copy verify payload” button (serverSeed/clientSeed/nonce/game/outcome) for external verification

## Mines-specific
- [ ] Return explicit `revealedSafeCells` and `minePositions` fields from backend on settle to avoid ambiguity in outcome semantics
- [ ] Add defensive UI state reset when round enters impossible states (missing roundId, stale round, double-click race)

## Crash-specific
- [ ] Align displayed crash verification outcome explicitly to authoritative server crash point
- [ ] Disable launch while in-flight API request with loading text to avoid accidental double submits

## Product / UX
- [ ] Add sound toggle + persist preference in localStorage
- [ ] Add bet confirmation modal for large bets (e.g., > $100)
- [ ] Improve leaderboard query strategy (server-side aggregate/RPC) to avoid client-side heavy scans as bets grow
- [ ] Add mobile media-query pass for all game pages and verify tap targets

## QA / Ops
- [ ] Add a smoke-test checklist script (curl-based) for edge functions (happy + error paths)
- [ ] Add minimal telemetry/logging for failed bets and verify attempts to speed debugging

## Current status checkpoints
- [x] Fix mines provably-fair verification mismatch (mines-aware comparison)
- [x] Update history verify modal logic for mines-aware verification
- [x] Create summary file listing additions/fixes so far (`ADDITIONS_AND_FIXES_SUMMARY.md`)

## Thorough testing
- [x] Backend/API checks (happy paths + edge/error paths for `place-bet`)
- [ ] Backend/API checks for `verify-bet` deployment + endpoint scenarios
- [~] Frontend page-level checks for all pages in `pages/` via browser interactions
  - [x] coin.html: place bet + verify success
  - [x] dice.html: place bet + verify success
  - [x] slots.html: place bet + verify success
  - [x] mines.html: loss flow reproduced and verify currently shows mismatch
  - [ ] crash.html: full flow not yet completed in this latest pass
  - [ ] leaderboard.html: dedicated page flow not yet completed in this latest pass
  - [ ] history.html: dedicated page flow not yet completed in this latest pass
- [~] Integration checks: balance consistency, nonce progression, provably fair parity
  - [x] Balance changed consistently during coin/dice/slots/mines actions in-session
  - [x] Nonce increments observed across sequential bets
  - [ ] Provably fair parity fully green (mines mismatch remains reproducible)

## UI Refresh + Wallet Page (approved)
- [x] Confirm plan with user
- [x] Update shared visual theme in `css/shared.css` toward premium sportsbook style
- [x] Create `pages/wallet.html` with balance/actions/ledger/account sections
- [x] Update `pages/index.html` lobby with utility strip + wallet entry
- [x] Add wallet link consistency in footer/nav on key pages
- [ ] Run critical-path browser test: login → lobby → wallet → nav links

## Finalize
- [ ] Summarize fixes, test results, and remaining recommendations
