# E-Ticket System - Database Setup Guide

Complete guide for setting up a new Supabase project for the E-Ticket system.

## 📋 Prerequisites

- A Supabase account (free tier works)
- Access to Supabase SQL Editor
- Basic understanding of SQL

## 🚀 Quick Setup (3 Steps)

### Step 1: Run Main Database Setup

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of [`01-main-setup.sql`](file:///d:/works/eticket/setup/01-main-setup.sql)
5. Click **Run**

This creates:
- ✅ All tables (profiles, tickets, scan_logs)
- ✅ Row Level Security policies
- ✅ Performance indexes
- ✅ Utility functions

### Step 2: Create Users and Assign Roles

1. Go to **Authentication → Users** in Supabase Dashboard
2. Click **Add user** (email + password)
3. Create at least one admin user and optionally staff users
4. Copy the user UUIDs from the users table
5. Open [`02-create-users.sql`](file:///d:/works/eticket/setup/02-create-users.sql)
6. Replace `YOUR_ADMIN_USER_UUID` and `YOUR_STAFF_USER_UUID` with actual UUIDs
7. Run the modified script in SQL Editor

### Step 3: (Optional) Enable Dashboard Performance

For optimized dashboard loading:

1. Open [`03-dashboard-materialized-view.sql`](file:///d:/works/eticket/setup/03-dashboard-materialized-view.sql)
2. Run it in SQL Editor
3. Manually refresh when needed: `SELECT refresh_dashboard_stats();`

## 📁 Setup Files Overview

| File | Purpose | Required |
|------|---------|----------|
| `01-main-setup.sql` | Core database schema, policies, indexes | ✅ Yes |
| `02-create-users.sql` | Assign roles to users | ✅ Yes |
| `03-dashboard-materialized-view.sql` | Dashboard performance optimization | ⚪ Optional |

## 🔑 User Roles

The system supports two roles:

- **admin**: Full access (create tickets, view all data, admin dashboard)
- **staff**: Limited access (scan tickets, view scan history)

## 📊 Database Schema

### Tables

**profiles**
- Links auth.users to roles
- Fields: `id` (uuid), `role` (admin/staff), `created_at`

**tickets**
- Main ticket storage
- Fields: `id`, `ticket_id` (uuid), `name`, `batch_id`, `status`, `created_at`, `checked_in_at`

**scan_logs**
- Tracks all valid ticket scans
- Fields: `id`, `ticket_id`, `scanned_by`, `status`, `scanned_at`

**dashboard_stats** (optional materialized view)
- Pre-computed statistics for fast dashboard loading
- Refreshed manually or via cron

## 🔒 Security Features

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Admins can create tickets
- ✅ All authenticated users can scan tickets
- ✅ Users can only read their own profile
- ✅ Secure function for email lookups

## ⚡ Performance Optimizations

The setup includes:

1. **Indexes** on frequently queried columns
2. **Composite indexes** for common query patterns
3. **Partial indexes** for status-specific queries
4. **Materialized view** for dashboard statistics (optional)

Expected performance:
- Login: < 300ms
- Dashboard load: < 1s (< 500ms with materialized view)
- API calls: < 400ms

## 🧪 Verify Setup

After running the scripts, verify everything is working:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'tickets', 'scan_logs');

-- Check indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'tickets', 'scan_logs');

-- Check users and roles
SELECT u.email, p.role 
FROM auth.users u 
LEFT JOIN profiles p ON u.id = p.id;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'tickets', 'scan_logs');
```

## 🔄 Updating an Existing Project

If you already have a Supabase project and want to update it:

1. The scripts use `IF NOT EXISTS` and `DO $$ BEGIN` blocks
2. Safe to run multiple times
3. Existing data will not be affected
4. New indexes and policies will be added

## 🆘 Troubleshooting

### "relation already exists"
- This is normal if running scripts multiple times
- The scripts are designed to be idempotent

### "permission denied"
- Make sure you're running scripts as the Supabase admin
- Check that RLS policies are correctly set up

### "must be owner of table users"
- ✅ **FIXED** - This error has been resolved in the latest version
- The script no longer tries to create indexes on `auth.users` table
- If you see this error, re-download the latest `01-main-setup.sql`

### "user UUID not found"
- Make sure to create users in Authentication first
- Copy the exact UUID from the auth.users table

### Slow dashboard loading
- Run the optional materialized view script
- Manually refresh: `SELECT refresh_dashboard_stats();`
- Consider enabling pg_cron for automatic refresh

## 📝 Next Steps

After database setup:

1. Update your `.env.local` with Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

2. Deploy your Next.js application

3. Test the login flow with your admin user

4. Create some test tickets to verify functionality

## 🔗 Related Documentation

- [PERFORMANCE_OPTIMIZATION.md](file:///d:/works/eticket/PERFORMANCE_OPTIMIZATION.md) - Performance tuning guide
- [PERFORMANCE_QUICKSTART.md](file:///d:/works/eticket/PERFORMANCE_QUICKSTART.md) - Quick performance setup
- [README.md](file:///d:/works/eticket/README.md) - Main project documentation

## 💡 Tips

- **Backup**: Export your database schema regularly
- **Testing**: Use separate Supabase projects for dev/staging/production
- **Monitoring**: Check Supabase logs for slow queries
- **Scaling**: The materialized view helps with large datasets (1000+ tickets)
