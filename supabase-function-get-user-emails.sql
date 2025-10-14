-- Function to get user emails for scan logs
-- Run this in Supabase SQL Editor

-- Create a function to get user email by ID
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

-- Grant execute permission
grant execute on function get_user_email(uuid) to authenticated;

