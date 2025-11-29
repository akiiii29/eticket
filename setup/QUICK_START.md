# Database Setup Files - Quick Reference

This directory contains consolidated SQL scripts for setting up a new Supabase project.

## 🎯 Quick Start (3 Files Only!)

### 1️⃣ Main Setup (REQUIRED)
**File**: `01-main-setup.sql`
- Creates all tables (profiles, tickets, scan_logs)
- Sets up Row Level Security policies
- Adds all performance indexes
- Creates utility functions

**Run this first!**

### 2️⃣ User Setup (REQUIRED)
**File**: `02-create-users.sql`
- Assigns roles to authenticated users
- Template for admin and staff users

**Edit UUIDs, then run this second!**

### 3️⃣ Performance Optimization (OPTIONAL)
**File**: `03-dashboard-materialized-view.sql`
- Creates materialized view for dashboard stats
- 80-90% faster dashboard loading
- Recommended for production

**Run this third if you want optimized performance!**

## 📖 Full Documentation

See [`README.md`](file:///d:/works/eticket/setup/README.md) for:
- Detailed setup instructions
- Troubleshooting guide
- Verification queries
- Performance tips

## ⚡ What Happened to Other SQL Files?

All the scattered SQL files have been consolidated:

| Old Files | Now In |
|-----------|--------|
| `supabase-schema.sql` | `01-main-setup.sql` |
| `supabase-combined.sql` | `01-main-setup.sql` |
| `supabase-performance-indexes.sql` | `01-main-setup.sql` |
| `supabase-migration-scan-logs.sql` | `01-main-setup.sql` |
| `supabase-add-batch-id.sql` | `01-main-setup.sql` |
| `supabase-function-get-user-emails.sql` | `01-main-setup.sql` |
| `supabase-migration-timestamp-to-timestamptz.sql` | `01-main-setup.sql` |
| `supabase-dashboard-materialized-view.sql` | `03-dashboard-materialized-view.sql` |

**Result**: 8 files → 3 files! 🎉

## 🔄 For Existing Projects

The old SQL files still work, but the new consolidated files are:
- ✅ Easier to use
- ✅ Better organized
- ✅ Fully documented
- ✅ Idempotent (safe to run multiple times)

## 💡 Pro Tips

1. **Always run in order**: 01 → 02 → 03
2. **Backup first** if updating existing project
3. **Test in dev** before running in production
4. **Keep UUIDs safe** - you'll need them for user setup
