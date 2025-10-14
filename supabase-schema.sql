-- E-Ticket System Database Schema
-- Run this in your Supabase SQL Editor

-- Create profiles table
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role text check (role in ('admin', 'staff')),
  created_at timestamptz default now()
);

-- Create tickets table
create table tickets (
  id bigint primary key generated always as identity,
  ticket_id uuid unique not null,
  name text not null,
  batch_id uuid not null,
  status text check (status in ('unused', 'used')) default 'unused',
  created_at timestamptz default now(),
  checked_in_at timestamptz
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table tickets enable row level security;

-- Profiles policies
create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

-- Tickets policies (authenticated users can read all tickets)
create policy "Authenticated users can read tickets"
  on tickets for select
  using (auth.role() = 'authenticated');

create policy "Admin users can insert tickets"
  on tickets for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Authenticated users can update tickets"
  on tickets for update
  using (auth.role() = 'authenticated');

-- Example: Create profile for admin user (replace USER_UUID with actual user ID from auth.users)
-- insert into profiles (id, role) values ('USER_UUID', 'admin');

-- Example: Create profile for staff user
-- insert into profiles (id, role) values ('USER_UUID', 'staff');

-- Create scan_logs table for tracking approved scans only
create table scan_logs (
  id bigint primary key generated always as identity,
  ticket_id uuid not null references tickets(ticket_id) on delete cascade,
  scanned_by uuid not null references auth.users on delete cascade,
  status text not null default 'valid' check (status = 'valid'),
  scanned_at timestamptz default now()
);

-- Enable Row Level Security
alter table scan_logs enable row level security;

-- Policies for scan_logs
create policy "Authenticated users can insert scan logs"
  on scan_logs for insert
  with check (auth.role() = 'authenticated');

create policy "Users can read their own scan logs"
  on scan_logs for select
  using (auth.role() = 'authenticated');

-- Create index for faster queries
create index idx_scan_logs_ticket_id on scan_logs(ticket_id);
create index idx_scan_logs_scanned_by on scan_logs(scanned_by);
create index idx_scan_logs_scanned_at on scan_logs(scanned_at desc);

-- Function to get user email by ID
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

-- Grant execute permission
grant execute on function get_user_email(uuid) to authenticated;

