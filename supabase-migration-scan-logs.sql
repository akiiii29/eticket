-- Migration: Add scan_logs table for tracking scan history
-- Run this in your Supabase SQL Editor if you already have the database set up

-- Create scan_logs table for tracking who scanned which ticket
create table if not exists scan_logs (
  id bigint primary key generated always as identity,
  ticket_id uuid not null references tickets(ticket_id) on delete cascade,
  scanned_by uuid not null references auth.users on delete cascade,
  status text not null check (status in ('valid', 'invalid', 'already_used', 'error')),
  scanned_at timestamp default now()
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

-- Create indexes for faster queries
create index if not exists idx_scan_logs_ticket_id on scan_logs(ticket_id);
create index if not exists idx_scan_logs_scanned_by on scan_logs(scanned_by);
create index if not exists idx_scan_logs_scanned_at on scan_logs(scanned_at desc);

