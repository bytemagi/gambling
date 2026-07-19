-- ============================================================
-- Fuckitt's Funhouse — Supabase Schema
-- Run this once in your Supabase project → SQL Editor
-- ============================================================

-- ── Profiles table (extends Supabase auth.users) ──────────────
create table if not exists public.profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  username        text unique not null,
  balance         integer not null default 100,
  free_spins      integer not null default 0,
  referral_code   text unique,
  referred_by     text,
  signup_bonus_claimed boolean not null default false,
  created_at      timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  new_referral_code text;
begin
  -- Generate unique 6-character referral code
  loop
    new_referral_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    exit when not exists (select 1 from public.profiles where referral_code = new_referral_code);
  end loop;

  insert into public.profiles (id, username, referral_code)
  values (new.id, new.raw_user_meta_data->>'username', new_referral_code);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Bets table ────────────────────────────────────────────────
create table if not exists public.bets (
  id               bigserial primary key,
  user_id          uuid references public.profiles(id) on delete cascade not null,
  username         text not null,
  game             text not null,           -- 'coin' | 'dice' | 'slots' | 'crash' | 'mines'
  amount           integer not null,
  outcome          jsonb not null,          -- { result, win, delta }
  balance_after    integer not null,
  server_seed      text not null,           -- revealed after bet for verification
  server_seed_hash text not null,           -- shown before bet so player can verify later
  client_seed      text not null,
  nonce            integer not null,
  created_at       timestamptz default now()
);

-- ── Mines rounds table (server-authoritative multi-step gameplay) ──
create table if not exists public.mines_rounds (
  id               bigserial primary key,
  user_id          uuid references public.profiles(id) on delete cascade not null,
  username         text not null,
  bet_amount       integer not null check (bet_amount > 0),
  mine_count       integer not null check (mine_count >= 1 and mine_count <= 24),
  mines            jsonb not null default '[]'::jsonb,
  revealed         jsonb not null default '[]'::jsonb,
  status           text not null default 'active' check (status in ('active','lost','cashed_out')),
  server_seed      text not null,
  server_seed_hash text not null,
  client_seed      text not null,
  nonce            integer not null,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.bets         enable row level security;
alter table public.mines_rounds enable row level security;

-- Profiles: users can only read/update their own row
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Bets: users can insert their own bets, read all (for live feed)
create policy "bets_insert_own" on public.bets
  for insert with check (auth.uid() = user_id);

create policy "bets_select_all" on public.bets
  for select using (true);

-- Mines rounds: users can only read/write their own rounds
create policy "mines_rounds_select_own" on public.mines_rounds
  for select using (auth.uid() = user_id);

create policy "mines_rounds_insert_own" on public.mines_rounds
  for insert with check (auth.uid() = user_id);

create policy "mines_rounds_update_own" on public.mines_rounds
  for update using (auth.uid() = user_id);

-- ── Realtime ─────────────────────────────────────────────────
-- Enable realtime on bets table for live feed
alter publication supabase_realtime add table public.bets;

-- ── Atomic balance functions (called by Edge Function) ───────
-- Deducts amount only if balance is sufficient, returns new balance
create or replace function public.deduct_balance(p_amount integer)
returns integer language plpgsql security definer as $$
declare new_bal integer;
begin
  update public.profiles
    set balance = balance - p_amount
    where id = auth.uid() and balance >= p_amount
    returning balance into new_bal;
  if not found then
    raise exception 'Insufficient balance';
  end if;
  return new_bal;
end;
$$;

-- Credits amount back (winnings)
create or replace function public.credit_balance(p_amount integer)
returns void language plpgsql security definer as $$
begin
  update public.profiles
    set balance = balance + p_amount
    where id = auth.uid();
end;
$$;

-- Credits amount for a specific user (used by edge functions with service role)
create or replace function public.credit_balance_for(p_user_id uuid, p_amount integer)
returns void language plpgsql security definer as $$
begin
  update public.profiles
    set balance = balance + p_amount
    where id = p_user_id;
end;
$$;
