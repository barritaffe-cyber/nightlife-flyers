-- Nightlife Flyers auth + billing scaffolding

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  status text default 'trial',
  current_period_end timestamptz,
  billing_provider text default 'powertranz',
  plan text default 'monthly',
  founding_discount_percent integer not null default 0,
  powertranz_transaction_id text,
  powertranz_pan_token text,
  powertranz_order_id text,
  generation_used integer not null default 0,
  generation_cycle_end timestamptz,
  starter_generations_used integer not null default 0,
  starter_uploads_used integer not null default 0,
  starter_clean_exports_used integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists billing_checkouts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  selection jsonb not null,
  founding_discount_applied boolean not null default false,
  founding_discount_percent integer not null default 0,
  original_price numeric(10,2),
  effective_price numeric(10,2),
  spi_token text,
  transaction_identifier text not null,
  order_identifier text not null,
  powertranz_transaction_id text,
  powertranz_pan_token text,
  status text not null default 'initiated',
  expires_at timestamptz not null,
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

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  path text,
  properties jsonb not null default '{}'::jsonb,
  user_id uuid references auth.users on delete set null,
  email text,
  anon_id text,
  session_id text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  landing_path text,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);

alter table profiles add column if not exists generation_used integer not null default 0;
alter table profiles add column if not exists generation_cycle_end timestamptz;
alter table profiles add column if not exists starter_generations_used integer not null default 0;
alter table profiles add column if not exists starter_uploads_used integer not null default 0;
alter table profiles add column if not exists starter_clean_exports_used integer not null default 0;
alter table profiles add column if not exists founding_discount_percent integer not null default 0;
alter table profiles add column if not exists powertranz_transaction_id text;
alter table profiles add column if not exists powertranz_pan_token text;
alter table profiles add column if not exists powertranz_order_id text;
alter table profiles alter column billing_provider set default 'powertranz';

alter table billing_checkouts add column if not exists email text;
alter table billing_checkouts add column if not exists selection jsonb;
alter table billing_checkouts add column if not exists founding_discount_applied boolean not null default false;
alter table billing_checkouts add column if not exists founding_discount_percent integer not null default 0;
alter table billing_checkouts add column if not exists original_price numeric(10,2);
alter table billing_checkouts add column if not exists effective_price numeric(10,2);
alter table billing_checkouts add column if not exists spi_token text;
alter table billing_checkouts add column if not exists transaction_identifier text;
alter table billing_checkouts add column if not exists order_identifier text;
alter table billing_checkouts add column if not exists powertranz_transaction_id text;
alter table billing_checkouts add column if not exists powertranz_pan_token text;
alter table billing_checkouts add column if not exists status text default 'initiated';
alter table billing_checkouts add column if not exists expires_at timestamptz;
alter table billing_checkouts add column if not exists created_at timestamptz default now();
alter table billing_checkouts add column if not exists updated_at timestamptz default now();

alter table analytics_events add column if not exists event_name text;
alter table analytics_events add column if not exists path text;
alter table analytics_events add column if not exists properties jsonb not null default '{}'::jsonb;
alter table analytics_events add column if not exists user_id uuid references auth.users on delete set null;
alter table analytics_events add column if not exists email text;
alter table analytics_events add column if not exists anon_id text;
alter table analytics_events add column if not exists session_id text;
alter table analytics_events add column if not exists referrer text;
alter table analytics_events add column if not exists utm_source text;
alter table analytics_events add column if not exists utm_medium text;
alter table analytics_events add column if not exists utm_campaign text;
alter table analytics_events add column if not exists utm_term text;
alter table analytics_events add column if not exists utm_content text;
alter table analytics_events add column if not exists landing_path text;
alter table analytics_events add column if not exists user_agent text;
alter table analytics_events add column if not exists ip_hash text;
alter table analytics_events add column if not exists created_at timestamptz not null default now();

alter table profiles enable row level security;
alter table devices enable row level security;
alter table analytics_events enable row level security;

create index if not exists analytics_events_created_at_idx on analytics_events (created_at desc);
create index if not exists analytics_events_event_name_idx on analytics_events (event_name);
create index if not exists analytics_events_user_id_idx on analytics_events (user_id);
create index if not exists analytics_events_anon_id_idx on analytics_events (anon_id);
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
