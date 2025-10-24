-- Billing and subscription core schema (run in Supabase SQL Editor)
-- Extensions (safe if already enabled)
create extension if not exists pgcrypto;

-- Helper to auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Subscribers table: single source of truth for account state
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscribed boolean not null default false,
  subscription_status text not null default 'none',
  subscription_tier text not null default 'free',
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscribers_user_id_idx on public.subscribers(user_id);
create index if not exists subscribers_stripe_customer_idx on public.subscribers(stripe_customer_id);
create index if not exists subscribers_status_idx on public.subscribers(subscription_status);

-- RLS
alter table public.subscribers enable row level security;

-- Users can read their own subscription row by email or user_id
create policy if not exists subscribers_select_own
on public.subscribers for select
using (
  (auth.uid() is not null and user_id = auth.uid())
  or (auth.email() is not null and email = auth.email())
);

-- No insert/update/delete for regular users (service role bypasses RLS)

-- updated_at trigger
create trigger set_updated_at before update on public.subscribers
for each row execute function public.set_updated_at();

-- Idempotency for webhook processing
create table if not exists public.processed_events (
  id text primary key,
  created_at timestamptz not null default now()
);
create index if not exists processed_events_created_idx on public.processed_events(created_at);
