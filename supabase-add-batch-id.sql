-- Migration: Add batch_id to existing tickets table
-- Run this in Supabase SQL Editor

-- Add batch_id column
alter table tickets add column if not exists batch_id uuid;

-- Set batch_id for existing tickets (each gets unique batch)
update tickets set batch_id = gen_random_uuid() where batch_id is null;

-- Make batch_id not null
alter table tickets alter column batch_id set not null;

-- Create index for faster grouping queries
create index if not exists idx_tickets_batch_id on tickets(batch_id);

