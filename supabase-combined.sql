-- Combined Supabase setup for Rise Team Ticket
-- Run this whole script in the Supabase SQL Editor.
-- Safe to run multiple times (uses IF NOT EXISTS where possible).

-- =============================
-- 1) Core tables
-- =============================
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  role text check (role in ('admin', 'staff')),
  created_at timestamptz default now()
);

create table if not exists tickets (
  id bigint primary key generated always as identity,
  ticket_id uuid unique not null,
  name text not null,
  batch_id uuid not null,
  status text check (status in ('unused', 'used')) default 'unused',
  created_at timestamptz default now(),
  checked_in_at timestamptz
);

-- =============================
-- 2) Row Level Security + Policies
-- =============================
alter table profiles enable row level security;
alter table tickets enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can read own profile'
  ) then
    create policy "Users can read own profile"
      on profiles for select using (auth.uid() = id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'tickets' and policyname = 'Authenticated users can read tickets'
  ) then
    create policy "Authenticated users can read tickets"
      on tickets for select using (auth.role() = 'authenticated');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'tickets' and policyname = 'Admin users can insert tickets'
  ) then
    create policy "Admin users can insert tickets"
      on tickets for insert
      with check (
        exists (
          select 1 from profiles
          where profiles.id = auth.uid()
          and profiles.role = 'admin'
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'tickets' and policyname = 'Authenticated users can update tickets'
  ) then
    create policy "Authenticated users can update tickets"
      on tickets for update using (auth.role() = 'authenticated');
  end if;
end $$;

-- =============================
-- 3) Scan logs + policies
-- =============================
create table if not exists scan_logs (
  id bigint primary key generated always as identity,
  ticket_id uuid not null references tickets(ticket_id) on delete cascade,
  scanned_by uuid not null references auth.users on delete cascade,
  status text not null default 'valid' check (status = 'valid'),
  scanned_at timestamptz default now()
);

alter table scan_logs enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'scan_logs' and policyname = 'Authenticated users can insert scan logs'
  ) then
    create policy "Authenticated users can insert scan logs"
      on scan_logs for insert with check (auth.role() = 'authenticated');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'scan_logs' and policyname = 'Users can read their own scan logs'
  ) then
    create policy "Users can read their own scan logs"
      on scan_logs for select using (auth.role() = 'authenticated');
  end if;
end $$;

-- Indexes for scan_logs
create index if not exists idx_scan_logs_ticket_id on scan_logs(ticket_id);
create index if not exists idx_scan_logs_scanned_by on scan_logs(scanned_by);
create index if not exists idx_scan_logs_scanned_at on scan_logs(scanned_at desc);

-- =============================
-- 4) Utility function: get_user_email
-- =============================
create or replace function get_user_email(user_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  user_email text;
begin
  select email into user_email
  from auth.users
  where id = user_id;

  return coalesce(user_email, 'Unknown');
end;
$$;

grant execute on function get_user_email(uuid) to authenticated;

-- =============================
-- 5) Performance indexes
-- =============================
create index if not exists idx_tickets_ticket_id on tickets(ticket_id);
create index if not exists idx_tickets_status on tickets(status);
create index if not exists idx_tickets_batch_id on tickets(batch_id);
create index if not exists idx_tickets_created_at on tickets(created_at desc);
create index if not exists idx_tickets_checked_in_at on tickets(checked_in_at desc);
create index if not exists idx_tickets_status_created_at on tickets(status, created_at desc);
create index if not exists idx_tickets_batch_id_status on tickets(batch_id, status);
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_scan_logs_status on scan_logs(status);
create index if not exists idx_scan_logs_ticket_id_scanned_at on scan_logs(ticket_id, scanned_at desc);
create index if not exists idx_tickets_unused on tickets(ticket_id) where status = 'unused';
create index if not exists idx_tickets_used on tickets(ticket_id, checked_in_at) where status = 'used';
create index if not exists idx_auth_users_id_email on auth.users(id, email);

-- =============================
-- 6) Optional: convert timestamp -> timestamptz (idempotent where supported)
-- =============================
-- Note: These conversions are safe when columns are still timestamp without time zone.
-- If already timestamptz, the USING casts will be no-ops.
do $$ begin
  begin
    execute 'alter table profiles alter column created_at type timestamptz using created_at at time zone ''UTC''';
  exception when others then null; end;
  begin
    execute 'alter table tickets alter column created_at type timestamptz using created_at at time zone ''UTC''';
  exception when others then null; end;
  begin
    execute 'alter table tickets alter column checked_in_at type timestamptz using checked_in_at at time zone ''UTC''';
  exception when others then null; end;
  begin
    execute 'alter table scan_logs alter column scanned_at type timestamptz using scanned_at at time zone ''UTC''';
  exception when others then null; end;
end $$;

-- End of combined script


