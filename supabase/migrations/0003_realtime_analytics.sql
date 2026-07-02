-- Enable Supabase Realtime (postgres_changes) on the append-only analytics
-- tables so admin dashboards can subscribe to live inserts instead of polling.
-- Idempotent: safe to re-run.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'points_ledger'
  ) then
    alter publication supabase_realtime add table public.points_ledger;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'events'
  ) then
    alter publication supabase_realtime add table public.events;
  end if;
end
$$;
