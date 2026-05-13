# 🎰 Fuckitt's Funhouse

A mobile-first browser casino app with three games of chance, powered by Supabase for auth, balance, and realtime.

## Games
- 🪙 **Coin Flip** — 50/50, pays 2×
- 🎲 **Dice Roll** — guess 1–6, pays 5×
- 🎰 **Slot Machine** — match symbols, up to 20×

---

## 🚀 Setup Guide

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (free account)
2. Click **New Project**
3. Fill in:
   - **Name:** fuckitts-funhouse (or anything)
   - **Database Password:** pick a strong one and save it somewhere
   - **Region:** pick the closest to you
4. Click **Create new project** — takes ~2 minutes to spin up

---

### Step 2 — Run the Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Open `supabase_schema.sql` from this repo and paste the entire contents
4. Click **Run** (or press Ctrl+Enter)

This creates:
- `profiles` table — stores username + balance per user
- `bets` table — records every bet for the live feed
- Row Level Security policies — users can only touch their own data
- A trigger that auto-creates a profile when someone signs up
- Realtime enabled on the `bets` table

---

### Step 3 — Get Your API Keys

1. In your Supabase project go to **Settings** (gear icon, bottom left)
2. Click **API**
3. You need two values:
   - **Project URL** — looks like `https://abcdefghijkl.supabase.co`
   - **anon public** key — long string under "Project API keys"

> ⚠️ Only copy the **anon** key. Never use the **service_role** key in frontend code.

---

### Step 4 — Add Keys to the App

Open `shared.js` and replace the placeholder values at the top:

```js
const SUPABASE_URL  = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON = 'YOUR_ANON_PUBLIC_KEY';
```

Example:
```js
const SUPABASE_URL  = 'https://abcdefghijkl.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

### Step 5 — Open the App

Open `index.html` in any browser. On Android, you can:
- Host it for free on [GitHub Pages](https://pages.github.com) and open the URL in Chrome
- Or serve it locally with any static file server

**First login registers automatically** — just type any username and password and hit Enter the Funhouse.

---

## 🗄️ Database Structure

### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Matches Supabase auth user ID |
| username | text | Display name |
| balance | integer | Current balance in $ |
| created_at | timestamptz | Account creation time |

### `bets`
| Column | Type | Description |
|--------|------|-------------|
| id | bigserial | Auto-increment bet ID |
| user_id | uuid | FK to profiles |
| username | text | Denormalized for feed display |
| game | text | `coin`, `dice`, or `slots` |
| amount | integer | Bet amount |
| outcome | jsonb | `{ result, win, delta }` |
| balance_after | integer | Balance after bet settled |
| created_at | timestamptz | Bet timestamp |

---

## 🔒 Security

- **Row Level Security (RLS)** is enabled on all tables
- Users can only read/update their own `profiles` row
- Users can only insert their own `bets` rows
- All users can read `bets` (powers the live feed)
- The Supabase anon key is safe to expose — RLS enforces all access rules
- **Never commit your service_role key**

---

## 📡 Realtime

The live feed on the lobby page uses Supabase Realtime. When any player places a bet, it instantly appears on all connected clients. This is enabled by:

```sql
alter publication supabase_realtime add table public.bets;
```

Which is already in `supabase_schema.sql`.

---

## 🗂️ File Structure

```
├── index.html          # Login + game lobby
├── coin.html           # Coin flip game
├── dice.html           # Dice roll game
├── slots.html          # Slot machine game
├── shared.js           # Supabase client, auth, bet logic (add your keys here)
├── shared.css          # Shared styles, logo, header, footer
├── logo.svg            # Graffiti-style SVG logo
├── supabase_schema.sql # Run this once in Supabase SQL Editor
└── README.md           # This file
```

---

## 🔧 Hosting on GitHub Pages (free)

1. Push this repo to GitHub
2. Go to repo **Settings → Pages**
3. Set source to **main branch / root**
4. Your app will be live at `https://yourusername.github.io/fuckitts-funhouse`

> Note: GitHub Pages serves over HTTPS which is required for Supabase auth to work correctly.
