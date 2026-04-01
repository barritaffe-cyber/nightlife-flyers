-- Nightlife Flyers auth + billing scaffolding

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  status text default 'trial',
  current_period_end timestamptz,
  billing_provider text default 'paddle',
  plan text default 'monthly',
  paddle_customer_id text,
  paddle_subscription_id text,
  generation_used integer not null default 0,
  generation_cycle_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  device_id text not null,
  device_type text not null check (device_type in ('pc','mobile')),
  last_seen_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (user_id, device_type)
);

alter table profiles add column if not exists generation_used integer not null default 0;
alter table profiles add column if not exists generation_cycle_end timestamptz;
alter table profiles add column if not exists paddle_customer_id text;
alter table profiles add column if not exists paddle_subscription_id text;

alter table profiles enable row level security;
alter table devices enable row level security;
drop policy if exists "profiles_read_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;
drop policy if exists "devices_read_own" on devices;
drop policy if exists "devices_insert_own" on devices;
drop policy if exists "devices_update_own" on devices;

create policy "profiles_read_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

create policy "devices_read_own" on devices
  for select using (auth.uid() = user_id);

create policy "devices_insert_own" on devices
  for insert with check (auth.uid() = user_id);

create policy "devices_update_own" on devices
  for update using (auth.uid() = user_id);
