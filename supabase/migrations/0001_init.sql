-- Milestone 1: core schema + RLS
create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  timezone text not null default 'Asia/Tokyo',
  plan text not null default 'free' check (plan in ('free','pro','lifetime')),
  status text not null default 'normal' check (status in ('normal','busy','sick')),
  energy_today int,
  last_grace_used_at date
);

create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  category text not null check (category in ('work','body','mind')),
  order_index int not null check (order_index between 0 and 4),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  date date not null,
  done boolean not null default false,
  intensity text not null check (intensity in ('S','M','L')),
  exp int not null check (exp in (1,2,3)),
  created_at timestamptz not null default now(),
  unique(user_id, habit_id, date)
);

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  mode text not null check (mode in ('growth','maintenance','recovery')),
  text text not null,
  accepted boolean,
  downgraded boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

create table if not exists if_then_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  if_text text not null,
  then_text text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists billing_customers (
  user_id uuid primary key references profiles(id) on delete cascade,
  stripe_customer_id text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table habits enable row level security;
alter table daily_logs enable row level security;
alter table proposals enable row level security;
alter table if_then_plans enable row level security;
alter table billing_customers enable row level security;

create policy "profiles_owner" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "habits_owner" on habits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "daily_logs_owner" on daily_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "proposals_owner" on proposals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "if_then_plans_owner" on if_then_plans
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "billing_customers_owner" on billing_customers
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
