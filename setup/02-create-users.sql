-- ============================================================================
-- E-TICKET SYSTEM - USER SETUP
-- ============================================================================
-- Run this AFTER creating users in Supabase Authentication Dashboard
-- This script assigns roles to users
-- ============================================================================

-- ============================================================================
-- INSTRUCTIONS:
-- ============================================================================
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add user" and create users with email/password
-- 3. Copy the user UUID from the users table
-- 4. Replace the UUIDs below with your actual user IUIDs
-- 5. Run this script in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- CREATE ADMIN USER PROFILE
-- ============================================================================
-- Replace 'YOUR_ADMIN_USER_UUID' with the actual UUID from auth.users

-- Example admin user
INSERT INTO profiles (id, role) 
VALUES ('YOUR_ADMIN_USER_UUID', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Example: If your admin user UUID is: 12345678-1234-1234-1234-123456789012
-- INSERT INTO profiles (id, role) 
-- VALUES ('12345678-1234-1234-1234-123456789012', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ============================================================================
-- CREATE STAFF USER PROFILE(S)
-- ============================================================================
-- Replace 'YOUR_STAFF_USER_UUID' with the actual UUID from auth.users

-- Example staff user
INSERT INTO profiles (id, role) 
VALUES ('YOUR_STAFF_USER_UUID', 'staff')
ON CONFLICT (id) DO UPDATE SET role = 'staff';

-- Example: If your staff user UUID is: 87654321-4321-4321-4321-210987654321
-- INSERT INTO profiles (id, role) 
-- VALUES ('87654321-4321-4321-4321-210987654321', 'staff')
-- ON CONFLICT (id) DO UPDATE SET role = 'staff';

-- ============================================================================
-- ADD MORE USERS AS NEEDED
-- ============================================================================
-- Copy the pattern above for additional users

-- Staff user 2
-- INSERT INTO profiles (id, role) 
-- VALUES ('ANOTHER_STAFF_UUID', 'staff')
-- ON CONFLICT (id) DO UPDATE SET role = 'staff';

-- ============================================================================
-- VERIFY USER ROLES
-- ============================================================================
-- Run this query to see all users and their roles:

SELECT 
  u.id,
  u.email,
  p.role,
  p.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY p.created_at DESC;

-- ============================================================================
-- QUICK REFERENCE
-- ============================================================================
-- To get user UUIDs, run:
-- SELECT id, email FROM auth.users;
--
-- To update a user's role:
-- UPDATE profiles SET role = 'admin' WHERE id = 'USER_UUID';
--
-- To remove a user's profile:
-- DELETE FROM profiles WHERE id = 'USER_UUID';
-- ============================================================================
