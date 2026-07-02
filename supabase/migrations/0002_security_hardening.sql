-- Security hardening for the CyberSim schema. Clears the Supabase security
-- advisor findings from 0001 without weakening access control:
--   * RLS helper functions move to a NON-API-exposed `private` schema so they
--     are no longer callable via /rest/v1/rpc (lints 0028/0029). They keep
--     EXECUTE for `authenticated` because RLS policy evaluation requires it.
--   * Trigger functions stay in `public` but EXECUTE is revoked from clients;
--     triggers fire without the invoking user needing EXECUTE.
--   * `sa_credentials` gets an explicit deny-all policy so the "RLS enabled,
--     no policy" info lint (0008) clears while remaining service-role only.
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- Private schema for RLS helpers (not exposed by PostgREST)
-- ---------------------------------------------------------------------------
create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.auth_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid(); $$;

create or replace function private.auth_org()
returns uuid
language sql stable security definer set search_path = public
as $$ select org_id from public.profiles where id = auth.uid(); $$;

create or replace function private.user_in_my_org(target uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = target and org_id = private.auth_org()
  );
$$;

revoke execute on function private.auth_role()          from public;
revoke execute on function private.auth_org()           from public;
revoke execute on function private.user_in_my_org(uuid) from public;
grant  execute on function private.auth_role()          to authenticated;
grant  execute on function private.auth_org()           to authenticated;
grant  execute on function private.user_in_my_org(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Repoint every policy that used public.auth_* to private.auth_*
-- ---------------------------------------------------------------------------
drop policy if exists organizations_super on public.organizations;
create policy organizations_super on public.organizations
  for all to authenticated
  using (private.auth_role() = 'super_admin') with check (private.auth_role() = 'super_admin');
drop policy if exists organizations_org_admin on public.organizations;
create policy organizations_org_admin on public.organizations
  for all to authenticated
  using (private.auth_role() = 'org_admin' and id = private.auth_org())
  with check (private.auth_role() = 'org_admin' and id = private.auth_org());
drop policy if exists organizations_employee_read on public.organizations;
create policy organizations_employee_read on public.organizations
  for select to authenticated using (id = private.auth_org());

drop policy if exists profiles_super on public.profiles;
create policy profiles_super on public.profiles
  for all to authenticated
  using (private.auth_role() = 'super_admin') with check (private.auth_role() = 'super_admin');
drop policy if exists profiles_org_admin on public.profiles;
create policy profiles_org_admin on public.profiles
  for all to authenticated
  using (private.auth_role() = 'org_admin' and org_id = private.auth_org())
  with check (private.auth_role() = 'org_admin' and org_id = private.auth_org());

drop policy if exists attack_modules_super on public.attack_modules;
create policy attack_modules_super on public.attack_modules
  for all to authenticated
  using (private.auth_role() = 'super_admin') with check (private.auth_role() = 'super_admin');
drop policy if exists badges_super on public.badges;
create policy badges_super on public.badges
  for all to authenticated
  using (private.auth_role() = 'super_admin') with check (private.auth_role() = 'super_admin');

drop policy if exists module_progress_super on public.module_progress;
create policy module_progress_super on public.module_progress
  for all to authenticated
  using (private.auth_role() = 'super_admin') with check (private.auth_role() = 'super_admin');
drop policy if exists module_progress_org_admin on public.module_progress;
create policy module_progress_org_admin on public.module_progress
  for all to authenticated
  using (private.auth_role() = 'org_admin' and private.user_in_my_org(user_id))
  with check (private.auth_role() = 'org_admin' and private.user_in_my_org(user_id));

drop policy if exists level1_results_super on public.level1_results;
create policy level1_results_super on public.level1_results
  for all to authenticated
  using (private.auth_role() = 'super_admin') with check (private.auth_role() = 'super_admin');
drop policy if exists level1_results_org_admin on public.level1_results;
create policy level1_results_org_admin on public.level1_results
  for all to authenticated
  using (private.auth_role() = 'org_admin' and private.user_in_my_org(user_id))
  with check (private.auth_role() = 'org_admin' and private.user_in_my_org(user_id));

drop policy if exists badges_earned_super on public.badges_earned;
create policy badges_earned_super on public.badges_earned
  for all to authenticated
  using (private.auth_role() = 'super_admin') with check (private.auth_role() = 'super_admin');
drop policy if exists badges_earned_org_admin on public.badges_earned;
create policy badges_earned_org_admin on public.badges_earned
  for all to authenticated
  using (private.auth_role() = 'org_admin' and private.user_in_my_org(user_id))
  with check (private.auth_role() = 'org_admin' and private.user_in_my_org(user_id));

drop policy if exists points_ledger_super on public.points_ledger;
create policy points_ledger_super on public.points_ledger
  for all to authenticated
  using (private.auth_role() = 'super_admin') with check (private.auth_role() = 'super_admin');
drop policy if exists points_ledger_org_admin on public.points_ledger;
create policy points_ledger_org_admin on public.points_ledger
  for all to authenticated
  using (private.auth_role() = 'org_admin' and org_id = private.auth_org())
  with check (private.auth_role() = 'org_admin' and org_id = private.auth_org());

drop policy if exists events_super on public.events;
create policy events_super on public.events
  for all to authenticated
  using (private.auth_role() = 'super_admin') with check (private.auth_role() = 'super_admin');
drop policy if exists events_org_admin on public.events;
create policy events_org_admin on public.events
  for all to authenticated
  using (private.auth_role() = 'org_admin' and org_id = private.auth_org())
  with check (private.auth_role() = 'org_admin' and org_id = private.auth_org());

-- ---------------------------------------------------------------------------
-- Drop the now-unused public helper functions
-- ---------------------------------------------------------------------------
drop function if exists public.auth_role();
drop function if exists public.auth_org();
drop function if exists public.user_in_my_org(uuid);

-- ---------------------------------------------------------------------------
-- Trigger functions: clients never call these directly; triggers fire without
-- the invoking user holding EXECUTE. Revoke to clear lints 0028/0029.
-- ---------------------------------------------------------------------------
revoke execute on function public.handle_new_user()      from public, anon, authenticated;
revoke execute on function public.handle_points_ledger() from public, anon, authenticated;
revoke execute on function public.sync_profile_xp()      from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- sa_credentials: explicit deny-all for clients (service role bypasses RLS)
-- ---------------------------------------------------------------------------
drop policy if exists sa_credentials_no_client_access on public.sa_credentials;
create policy sa_credentials_no_client_access on public.sa_credentials
  for all to anon, authenticated
  using (false) with check (false);
