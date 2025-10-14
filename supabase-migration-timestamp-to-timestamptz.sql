-- Migration: Convert all timestamp columns to timestamptz
-- Run this in your Supabase SQL Editor
-- This ensures all datetime values are stored with timezone information

-- 1. Alter profiles table
ALTER TABLE profiles 
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';

-- 2. Alter tickets table
ALTER TABLE tickets 
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN checked_in_at TYPE timestamptz USING checked_in_at AT TIME ZONE 'UTC';

-- 3. Alter scan_logs table
ALTER TABLE scan_logs 
  ALTER COLUMN scanned_at TYPE timestamptz USING scanned_at AT TIME ZONE 'UTC';

-- Verify the changes
-- Run these queries to confirm the columns are now timestamptz:
-- 
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name IN ('profiles', 'tickets', 'scan_logs') 
-- AND column_name LIKE '%_at'
-- ORDER BY table_name, column_name;

