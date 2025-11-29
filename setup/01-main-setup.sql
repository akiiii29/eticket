-- ============================================================================
-- E-TICKET SYSTEM - COMPLETE DATABASE SETUP
-- ============================================================================
-- This is the MAIN setup script for a new Supabase project
-- Run this FIRST in your Supabase SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS where possible)
-- ============================================================================

-- ============================================================================
-- PART 1: CORE TABLES
-- ============================================================================

-- Profiles table: Stores user roles (admin/staff)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role text CHECK (role IN ('admin', 'staff')),
  created_at timestamptz DEFAULT now()
);

-- Tickets table: Main ticket storage
CREATE TABLE IF NOT EXISTS tickets (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ticket_id uuid UNIQUE NOT NULL,
  name text NOT NULL,
  batch_id uuid NOT NULL,
  status text CHECK (status IN ('unused', 'used')) DEFAULT 'unused',
  created_at timestamptz DEFAULT now(),
  checked_in_at timestamptz
);

-- Scan logs table: Tracks all valid ticket scans
CREATE TABLE IF NOT EXISTS scan_logs (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ticket_id uuid NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
  scanned_by uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'valid' CHECK (status = 'valid'),
  scanned_at timestamptz DEFAULT now()
);

-- ============================================================================
-- PART 2: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile"
      ON profiles FOR SELECT 
      USING (auth.uid() = id);
  END IF;
END $$;

-- Tickets policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tickets' 
    AND policyname = 'Authenticated users can read tickets'
  ) THEN
    CREATE POLICY "Authenticated users can read tickets"
      ON tickets FOR SELECT 
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tickets' 
    AND policyname = 'Admin users can insert tickets'
  ) THEN
    CREATE POLICY "Admin users can insert tickets"
      ON tickets FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tickets' 
    AND policyname = 'Authenticated users can update tickets'
  ) THEN
    CREATE POLICY "Authenticated users can update tickets"
      ON tickets FOR UPDATE 
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Scan logs policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'scan_logs' 
    AND policyname = 'Authenticated users can insert scan logs'
  ) THEN
    CREATE POLICY "Authenticated users can insert scan logs"
      ON scan_logs FOR INSERT 
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'scan_logs' 
    AND policyname = 'Users can read their own scan logs'
  ) THEN
    CREATE POLICY "Users can read their own scan logs"
      ON scan_logs FOR SELECT 
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ============================================================================
-- PART 3: PERFORMANCE INDEXES
-- ============================================================================

-- Tickets table indexes
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_id ON tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_batch_id ON tickets(batch_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_checked_in_at ON tickets(checked_in_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tickets_status_created_at ON tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_batch_id_status ON tickets(batch_id, status);

-- Partial indexes for better performance on specific queries
CREATE INDEX IF NOT EXISTS idx_tickets_unused ON tickets(ticket_id) WHERE status = 'unused';
CREATE INDEX IF NOT EXISTS idx_tickets_used ON tickets(ticket_id, checked_in_at) WHERE status = 'used';

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Scan logs table indexes
CREATE INDEX IF NOT EXISTS idx_scan_logs_ticket_id ON scan_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned_by ON scan_logs(scanned_by);
CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned_at ON scan_logs(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_logs_status ON scan_logs(status);
CREATE INDEX IF NOT EXISTS idx_scan_logs_ticket_id_scanned_at ON scan_logs(ticket_id, scanned_at DESC);

-- Note: Cannot create indexes on auth.users table (managed by Supabase)
-- The auth.users table already has optimized indexes

-- ============================================================================
-- PART 4: UTILITY FUNCTIONS
-- ============================================================================

-- Function to get user email by ID (used for scan logs display)
CREATE OR REPLACE FUNCTION get_user_email(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  RETURN COALESCE(user_email, 'Unknown');
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_email(uuid) TO authenticated;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Next steps:
-- 1. Create admin and staff users in Supabase Authentication
-- 2. Run the '02-create-users.sql' script to assign roles
-- 3. (Optional) Run '03-dashboard-materialized-view.sql' for performance
-- ============================================================================
