-- Add deposits table for PayPal transactions
create table if not exists public.deposits (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.profiles(id) on delete cascade not null,
  username         text not null,
  amount           integer not null check (amount > 0),
  currency         text default 'USD',
  paypal_order_id  text unique not null,
  paypal_payer_id  text,
  status           text not null default 'pending' check (status in ('pending','completed','failed','cancelled')),
  created_at       timestamptz default now(),
  completed_at     timestamptz,
  metadata         jsonb default '{}'::jsonb
);

-- Enable RLS
alter table public.deposits enable row level security;

-- Users can only read/insert their own deposits
drop policy if exists "deposits_select_own" on public.deposits;
create policy "deposits_select_own" on public.deposits
  for select using (auth.uid() = user_id);

drop policy if exists "deposits_insert_own" on public.deposits;
create policy "deposits_insert_own" on public.deposits
  for insert with check (auth.uid() = user_id);

-- Create index for fast lookups
create index if not exists idx_deposits_user_id on public.deposits(user_id);
create index if not exists idx_deposits_paypal_order_id on public.deposits(paypal_order_id);
create index if not exists idx_deposits_status on public.deposits(status);

-- Function to credit balance after successful deposit
create or replace function public.credit_balance(p_user_id uuid, p_amount integer)
returns integer language plpgsql security definer as $$
declare new_bal integer;
begin
  update public.profiles
  set balance = balance + p_amount
  where id = p_user_id
  returning balance into new_bal;
  return coalesce(new_bal, 0);
end;
$$;
