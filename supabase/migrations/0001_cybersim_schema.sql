-- CyberSim backbone schema: organizations, profiles, reference data, progress,
-- append-only points ledger + events, and server-only super-admin credentials.
-- Idempotent: safe to re-run. Source of truth = TypeScript shapes in the app
-- (Organization/Employee, Level1Result, GameEvent, ATTACK_MODULES, BADGES).

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('super_admin', 'org_admin', 'employee');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  status     text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.user_role not null default 'employee',
  full_name   text not null default '',
  email       text,
  org_id      uuid references public.organizations (id) on delete set null,
  job_role    text,
  age         integer,
  gender      text,
  level       integer not null default 1,
  xp          integer not null default 0,
  status      text not null default 'active' check (status in ('active', 'inactive')),
  last_active timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists profiles_org_id_idx on public.profiles (org_id);

create table if not exists public.attack_modules (
  id    text primary key,
  name  text not null,
  icon  text,
  color text
);

create table if not exists public.badges (
  id     text primary key,
  name   text not null,
  icon   text,
  module text references public.attack_modules (id) on delete set null,
  descr  text
);

create table if not exists public.module_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  module_id    text not null references public.attack_modules (id) on delete cascade,
  score        integer not null default 0,
  completed_at timestamptz,
  unique (user_id, module_id)
);
create index if not exists module_progress_user_idx on public.module_progress (user_id);

create table if not exists public.level1_results (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  score        integer not null default 0,
  details      jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now()
);
create index if not exists level1_results_user_idx on public.level1_results (user_id);

create table if not exists public.badges_earned (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles (id) on delete cascade,
  badge_id  text not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);
create index if not exists badges_earned_user_idx on public.badges_earned (user_id);

create table if not exists public.points_ledger (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  org_id        uuid references public.organizations (id) on delete set null,
  delta         integer not null,
  reason        text,
  balance_after integer not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists points_ledger_user_idx on public.points_ledger (user_id, created_at);
create index if not exists points_ledger_org_idx on public.points_ledger (org_id, created_at);

create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (id) on delete cascade,
  org_id     uuid references public.organizations (id) on delete set null,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists events_org_idx on public.events (org_id, created_at);

create table if not exists public.sa_credentials (
  id         uuid primary key default gen_random_uuid(),
  key_hash   text not null,
  label      text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so policies don't recurse into RLS)
-- ---------------------------------------------------------------------------
create or replace function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.auth_org()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.profiles where id = auth.uid();
$$;

create or replace function public.user_in_my_org(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = target and org_id = public.auth_org()
  );
$$;

-- ---------------------------------------------------------------------------
-- Trigger: create a profiles row when an auth user is created
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, org_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'employee'),
    nullif(new.raw_user_meta_data ->> 'org_id', '')::uuid
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Trigger: points_ledger keeps a running balance and syncs profiles.xp
-- Per-user advisory lock serialises concurrent inserts so the balance is
-- computed atomically from the prior deltas, never a race-prone read.
-- ---------------------------------------------------------------------------
create or replace function public.handle_points_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prior_balance integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

  select coalesce(sum(delta), 0) into prior_balance
  from public.points_ledger
  where user_id = new.user_id;

  new.balance_after := prior_balance + new.delta;
  return new;
end;
$$;

drop trigger if exists points_ledger_balance on public.points_ledger;
create trigger points_ledger_balance
  before insert on public.points_ledger
  for each row execute function public.handle_points_ledger();

create or replace function public.sync_profile_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set xp = new.balance_after,
      last_active = now()
  where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists points_ledger_sync_xp on public.points_ledger;
create trigger points_ledger_sync_xp
  after insert on public.points_ledger
  for each row execute function public.sync_profile_xp();

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.organizations  enable row level security;
alter table public.profiles       enable row level security;
alter table public.attack_modules enable row level security;
alter table public.badges         enable row level security;
alter table public.module_progress enable row level security;
alter table public.level1_results enable row level security;
alter table public.badges_earned  enable row level security;
alter table public.points_ledger  enable row level security;
alter table public.events         enable row level security;
alter table public.sa_credentials enable row level security;

-- organizations
drop policy if exists organizations_super on public.organizations;
create policy organizations_super on public.organizations
  for all to authenticated
  using (public.auth_role() = 'super_admin')
  with check (public.auth_role() = 'super_admin');

drop policy if exists organizations_org_admin on public.organizations;
create policy organizations_org_admin on public.organizations
  for all to authenticated
  using (public.auth_role() = 'org_admin' and id = public.auth_org())
  with check (public.auth_role() = 'org_admin' and id = public.auth_org());

drop policy if exists organizations_employee_read on public.organizations;
create policy organizations_employee_read on public.organizations
  for select to authenticated
  using (id = public.auth_org());

-- profiles (a profile's "own row" key is its id = auth.uid())
drop policy if exists profiles_super on public.profiles;
create policy profiles_super on public.profiles
  for all to authenticated
  using (public.auth_role() = 'super_admin')
  with check (public.auth_role() = 'super_admin');

drop policy if exists profiles_org_admin on public.profiles;
create policy profiles_org_admin on public.profiles
  for all to authenticated
  using (public.auth_role() = 'org_admin' and org_id = public.auth_org())
  with check (public.auth_role() = 'org_admin' and org_id = public.auth_org());

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- reference tables: readable by any authenticated user, writable by super_admin
drop policy if exists attack_modules_read on public.attack_modules;
create policy attack_modules_read on public.attack_modules
  for select to authenticated using (true);

drop policy if exists attack_modules_super on public.attack_modules;
create policy attack_modules_super on public.attack_modules
  for all to authenticated
  using (public.auth_role() = 'super_admin')
  with check (public.auth_role() = 'super_admin');

drop policy if exists badges_read on public.badges;
create policy badges_read on public.badges
  for select to authenticated using (true);

drop policy if exists badges_super on public.badges;
create policy badges_super on public.badges
  for all to authenticated
  using (public.auth_role() = 'super_admin')
  with check (public.auth_role() = 'super_admin');

-- module_progress (user-keyed)
drop policy if exists module_progress_super on public.module_progress;
create policy module_progress_super on public.module_progress
  for all to authenticated
  using (public.auth_role() = 'super_admin')
  with check (public.auth_role() = 'super_admin');

drop policy if exists module_progress_org_admin on public.module_progress;
create policy module_progress_org_admin on public.module_progress
  for all to authenticated
  using (public.auth_role() = 'org_admin' and public.user_in_my_org(user_id))
  with check (public.auth_role() = 'org_admin' and public.user_in_my_org(user_id));

drop policy if exists module_progress_self on public.module_progress;
create policy module_progress_self on public.module_progress
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- level1_results (user-keyed)
drop policy if exists level1_results_super on public.level1_results;
create policy level1_results_super on public.level1_results
  for all to authenticated
  using (public.auth_role() = 'super_admin')
  with check (public.auth_role() = 'super_admin');

drop policy if exists level1_results_org_admin on public.level1_results;
create policy level1_results_org_admin on public.level1_results
  for all to authenticated
  using (public.auth_role() = 'org_admin' and public.user_in_my_org(user_id))
  with check (public.auth_role() = 'org_admin' and public.user_in_my_org(user_id));

drop policy if exists level1_results_self on public.level1_results;
create policy level1_results_self on public.level1_results
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- badges_earned (user-keyed)
drop policy if exists badges_earned_super on public.badges_earned;
create policy badges_earned_super on public.badges_earned
  for all to authenticated
  using (public.auth_role() = 'super_admin')
  with check (public.auth_role() = 'super_admin');

drop policy if exists badges_earned_org_admin on public.badges_earned;
create policy badges_earned_org_admin on public.badges_earned
  for all to authenticated
  using (public.auth_role() = 'org_admin' and public.user_in_my_org(user_id))
  with check (public.auth_role() = 'org_admin' and public.user_in_my_org(user_id));

drop policy if exists badges_earned_self on public.badges_earned;
create policy badges_earned_self on public.badges_earned
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- points_ledger (org + user keyed)
drop policy if exists points_ledger_super on public.points_ledger;
create policy points_ledger_super on public.points_ledger
  for all to authenticated
  using (public.auth_role() = 'super_admin')
  with check (public.auth_role() = 'super_admin');

drop policy if exists points_ledger_org_admin on public.points_ledger;
create policy points_ledger_org_admin on public.points_ledger
  for all to authenticated
  using (public.auth_role() = 'org_admin' and org_id = public.auth_org())
  with check (public.auth_role() = 'org_admin' and org_id = public.auth_org());

drop policy if exists points_ledger_self on public.points_ledger;
create policy points_ledger_self on public.points_ledger
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- events (org + user keyed)
drop policy if exists events_super on public.events;
create policy events_super on public.events
  for all to authenticated
  using (public.auth_role() = 'super_admin')
  with check (public.auth_role() = 'super_admin');

drop policy if exists events_org_admin on public.events;
create policy events_org_admin on public.events
  for all to authenticated
  using (public.auth_role() = 'org_admin' and org_id = public.auth_org())
  with check (public.auth_role() = 'org_admin' and org_id = public.auth_org());

drop policy if exists events_self on public.events;
create policy events_self on public.events
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- sa_credentials: RLS on, NO anon/authenticated policies -> service role only.

-- ---------------------------------------------------------------------------
-- Seed reference data (ids must match the app code)
-- ---------------------------------------------------------------------------
insert into public.attack_modules (id, name, icon, color) values
  ('phishing',   'Phishing Email', '📧', 'cyan'),
  ('vishing',    'Vishing Call',   '📞', 'green'),
  ('quidProQuo', 'Quid Pro Quo',   '🎁', 'amber'),
  ('tailgating', 'Tailgating',     '🚪', 'red'),
  ('usbDrop',    'USB Drop',       '💾', 'purple'),
  ('password',   'Password Attack','🔐', 'cyan'),
  ('data',       'Data Handling',  '📄', 'green')
on conflict (id) do update
  set name = excluded.name, icon = excluded.icon, color = excluded.color;

insert into public.badges (id, name, icon, module, descr) values
  ('phishing_spotter', 'Phishing Spotter', '🎣', 'phishing',   'Identified and reported a phishing email'),
  ('call_screener',    'Call Screener',    '📞', 'vishing',    'Handled a vishing attempt correctly'),
  ('deal_refuser',     'Deal Refuser',     '🎁', 'quidProQuo', 'Rejected a quid pro quo offer'),
  ('access_guardian',  'Access Guardian',  '🚪', 'tailgating', 'Enforced physical access policy'),
  ('usb_warrior',      'USB Warrior',      '💾', 'usbDrop',    'Handled malicious media correctly'),
  ('password_keeper',  'Password Keeper',  '🔐', 'password',   'Demonstrated workstation hygiene'),
  ('data_protector',   'Data Protector',   '📄', 'data',       'Secured sensitive information')
on conflict (id) do update
  set name = excluded.name, icon = excluded.icon, module = excluded.module, descr = excluded.descr;
