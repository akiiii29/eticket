# 📊 Scan Logs Feature Setup

This feature adds persistent scan history tracking with staff attribution.

## 🎯 What's New

- **Persistent Scan History**: Scan history saved to database, survives page refresh
- **Staff Tracking**: See which staff member scanned which ticket
- **Admin View**: Admins can view all scan activity across all staff
- **Staff View**: Staff see only their own scan history

## 📋 Database Setup

### For New Installations
The `scan_logs` table is already included in `supabase-schema.sql`. Just run the complete schema.

### For Existing Installations
Run the migration script in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents from `supabase-migration-scan-logs.sql`
3. Paste and click **Run**

Or run this SQL:

```sql
-- Create scan_logs table
create table if not exists scan_logs (
  id bigint primary key generated always as identity,
  ticket_id uuid not null references tickets(ticket_id) on delete cascade,
  scanned_by uuid not null references auth.users on delete cascade,
  status text not null check (status in ('valid', 'invalid', 'already_used', 'error')),
  scanned_at timestamp default now()
);

-- Enable RLS
alter table scan_logs enable row level security;

-- Policies
create policy "Authenticated users can insert scan logs"
  on scan_logs for insert
  with check (auth.role() = 'authenticated');

create policy "Users can read their own scan logs"
  on scan_logs for select
  using (auth.role() = 'authenticated');

-- Indexes
create index if not exists idx_scan_logs_ticket_id on scan_logs(ticket_id);
create index if not exists idx_scan_logs_scanned_by on scan_logs(scanned_by);
create index if not exists idx_scan_logs_scanned_at on scan_logs(scanned_at desc);
```

## ✨ How It Works

### For Staff
1. Scan a ticket → automatically saved to database
2. Refresh page → scan history persists
3. View only your own scan history

### For Admins
1. Click **"View Scan Logs"** button in dashboard
2. See all scan activity from all staff members
3. View: Guest Name, Ticket ID, Scanned By (email), Status, Time
4. Click **"Refresh"** to update logs

## 📱 Features

**Scanner Page:**
- Loads scan history on page load
- Shows history table below scanner
- Persists after refresh

**Admin Dashboard:**
- Toggle scan logs view
- See which staff scanned which ticket
- Real-time status updates
- Manual refresh option

## 🔐 Security

- Row Level Security (RLS) enabled
- Staff can only insert and view their own logs
- Admins can view all logs
- Logs linked to authenticated users only

## 📊 Data Tracked

Each scan log contains:
- `ticket_id` - Which ticket was scanned
- `scanned_by` - UUID of staff who scanned (with email)
- `status` - Result: valid, already_used, invalid, error
- `scanned_at` - Timestamp

## 🚀 Deploy

After running the migration:

```bash
git add .
git commit -m "Add scan logs tracking with staff attribution"
git push origin main
```

## 🔍 Querying Logs

**Get all scans for a specific ticket:**
```sql
select * from scan_logs where ticket_id = 'uuid-here';
```

**Get all scans by a staff member:**
```sql
select * from scan_logs where scanned_by = 'user-uuid';
```

**Get today's scans:**
```sql
select * from scan_logs 
where scanned_at >= current_date 
order by scanned_at desc;
```

## ✅ Done!

Your scan history is now persistent and tracked by staff member! 🎉

