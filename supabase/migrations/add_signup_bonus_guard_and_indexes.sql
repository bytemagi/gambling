-- Add signup_bonus_claimed column to prevent repeated bonus claims
alter table public.profiles add column if not exists signup_bonus_claimed boolean default false;

-- Add index on bets.user_id for faster queries
create index if not exists idx_bets_user_id on public.bets(user_id);
create index if not exists idx_bets_created_at on public.bets(created_at);
