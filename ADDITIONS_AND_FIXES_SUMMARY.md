# Additions and Fixes Summary

This file summarizes the additions and fixes implemented so far across backend, frontend, schema, and verification/testing support.

## 1) Server-side / Edge Function updates

### `supabase/functions/place-bet/index.ts`
- Added/updated **server-authoritative Mines lifecycle** handling:
  - Mines rounds are created and tracked server-side.
  - Supports start/reveal/cashout flow with round state checks.
  - Validates mines-specific action payloads (round id, action, cell index, mine count).
- Hardened input validation for:
  - game, amount, nonce, client seed
  - mines-specific action fields and invalid state transitions.
- Preserved provably-fair seed generation + response fields:
  - `serverSeed`, `serverSeedHash`, `clientSeed`, `nonce`

## 2) Database schema updates

### `supabase_schema.sql`
- Added `mines_rounds` table and related fields needed for server-authoritative Mines progression.
- Added/updated RLS policies for secure per-user access.
- Included comments/structure to support the mines round lifecycle and settlement checks.

## 3) Frontend gameplay updates

### `pages/mines.html`
- Refactored Mines to use **single authoritative round flow**:
  - Start round (single backend round start call)
  - Reveal cell calls tied to `roundId`
  - Cashout tied to same round
- Added stronger state handling around gameActive/round completion.
- Balance and UI updates synchronized with backend responses.
- Provably-fair section integrated with revealed seed data after settlement.

### `js/shared.js`
- Extended `apiPlaceBet(...)` to support optional provided client seed/nonce usage path.
- Added balance checks and helper behavior to reduce invalid client-side submissions.
- Keeps nonce/client seed flow compatible with provably-fair behavior.

### `js/provably-fair.js`
- Improved PF explanation copy/UX for clarity (client seed + nonce meaning, rotating/copying seed).
- Added client-seed copy helper.
- Added mines-aware comparison logic:
  - `compareDerivedOutcome(game, derived, expected)` now treats mines outcomes correctly by validating revealed safe cells against derived mine positions rather than forcing full-array equality.
- Updated `runVerify()` messages to clearer “consistent/not consistent with seeds”.

### `pages/history.html`
- Added the same mines-aware verification comparison logic in modal verification flow.
- Updated outcome verification in `openVerify(...)` to use mines-aware comparison.

## 4) Project tracking updates

### `TODO.md`
- Updated checklist to reflect:
  - completed review + scope confirmation
  - pending/active items for PF parity fixes, endpoint verification, and full-page thorough UI testing
  - requested documentation artifact tracking

## 5) Testing status snapshot (to date)

### Backend/API (completed)
- `place-bet`:
  - Happy paths validated for coin/dice/slots/crash/mines
  - Error/edge paths validated (invalid game/amount/nonce, unauthorized, mines invalid states)
  - Mines lifecycle edge checks:
    - duplicate reveal rejected
    - second cashout rejected
    - invalid action/cell/round/mineCount rejected

### Frontend/UI (partially completed in-browser)
- Login/navigation + Mines gameplay tested end-to-end.
- Balance updates and Mines cashout flow validated visually.
- PF verify mismatch bug reproduced and fixed in code for mines-aware comparison.

### Remaining known gap
- `verify-bet` endpoint currently not deployed in target Supabase project (`NOT_FOUND`) and needs deployment + endpoint retest to complete full endpoint coverage.

## 6) High-level outcomes

- Mines now follows server-authoritative round lifecycle.
- Provably-fair UX and seed handling are clearer for users.
- Mines verification mismatch root cause was identified and addressed in both:
  - in-game PF verify (`js/provably-fair.js`)
  - history modal verify (`pages/history.html`)
- A dedicated summary document now exists for all additions/fixes made so far.
