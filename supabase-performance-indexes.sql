-- Performance Optimization: Add Missing Indexes
-- Run this in your Supabase SQL Editor to improve query performance

-- Indexes for tickets table (most critical)
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_id ON tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_batch_id ON tickets(batch_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_checked_in_at ON tickets(checked_in_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tickets_status_created_at ON tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_batch_id_status ON tickets(batch_id, status);

-- Indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Additional scan_logs indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scan_logs_status ON scan_logs(status);
CREATE INDEX IF NOT EXISTS idx_scan_logs_ticket_id_scanned_at ON scan_logs(ticket_id, scanned_at DESC);

-- Partial indexes for better performance on specific queries
CREATE INDEX IF NOT EXISTS idx_tickets_unused ON tickets(ticket_id) WHERE status = 'unused';
CREATE INDEX IF NOT EXISTS idx_tickets_used ON tickets(ticket_id, checked_in_at) WHERE status = 'used';

-- Index for the get_user_email function optimization
CREATE INDEX IF NOT EXISTS idx_auth_users_id_email ON auth.users(id, email);
