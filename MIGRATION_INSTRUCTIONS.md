# 🔄 Migration Instructions

## For Existing Deployments

If you already deployed and need to add the scan logs feature, follow these steps:

### Step 1: Run Migration SQL

Go to your Supabase Dashboard → SQL Editor and run:

```sql
-- Copy and paste the entire content from supabase-migration-scan-logs.sql
-- Or run this directly:

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

-- Function to get user emails (IMPORTANT!)
create or replace function get_user_email(user_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  user_email text;
begin
  select email into user_email
  from auth.users
  where id = user_id;
  
  return coalesce(user_email, 'Unknown');
end;
$$;

grant execute on function get_user_email(uuid) to authenticated;
```

### Step 2: Deploy Code

```bash
git add .
git commit -m "Add scan logs feature with user attribution"
git push origin main
```

### Step 3: Verify

1. **Test Scanner**: Go to `/scanner` and scan a ticket
2. **Check History**: Refresh the scanner page - should see scan history
3. **Test Admin**: Go to `/admin`, click "View Scan Logs"
4. **Verify Emails**: Should see staff email addresses in the logs

## Troubleshooting

### Error: "relation scan_logs does not exist"
- Run the migration SQL in Supabase SQL Editor
- Make sure the table was created successfully

### Error: "function get_user_email does not exist"
- Run the function creation SQL
- Grant execute permission: `grant execute on function get_user_email(uuid) to authenticated;`

### Error: 500 on /api/scan-logs
- Check Supabase logs for errors
- Ensure the `get_user_email` function exists
- Verify RLS policies are set correctly

### Scanner history is empty
- Check browser console for errors
- Verify scan_logs table has data: `select * from scan_logs;`
- Ensure user is authenticated

### Admin can't see staff emails
- Verify the `get_user_email` function is created with `security definer`
- Check that it has proper permissions

## Test the Function

Run this in Supabase SQL Editor to test:

```sql
-- Test the get_user_email function
select get_user_email(auth.uid());
-- Should return your email
```

## ✅ Done!

Your scan logs feature is now fully functional with email attribution!

