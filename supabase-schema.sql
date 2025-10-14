-- E-Ticket System Database Schema
-- Run this in your Supabase SQL Editor

-- Create profiles table
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role text check (role in ('admin', 'staff')),
  created_at timestamp default now()
);

-- Create tickets table
create table tickets (
  id bigint primary key generated always as identity,
  ticket_id uuid unique not null,
  name text not null,
  status text check (status in ('unused', 'used')) default 'unused',
  created_at timestamp default now(),
  checked_in_at timestamp
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

