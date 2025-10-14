import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { ticket_id, status } = body;

  if (!ticket_id || !status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Insert scan log
  const { data: log, error } = await supabase
    .from('scan_logs')
    .insert({
      ticket_id,
      scanned_by: user.id,
      status,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ log });
}

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'my' or 'all'

  let query = supabase
    .from('scan_logs')
    .select(`
      *,
      tickets(name, ticket_id),
      profiles!scan_logs_scanned_by_fkey(id)
    `)
    .order('scanned_at', { ascending: false });

  // If type is 'my', only get current user's scans
  if (type === 'my') {
    query = query.eq('scanned_by', user.id);
  }

  const { data: logs, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get user emails for the logs
  const userIds = [...new Set(logs?.map(log => log.scanned_by) || [])];
  const { data: users } = await supabase.auth.admin.listUsers();
  
  const userMap = new Map(
    users?.users?.map(u => [u.id, u.email]) || []
  );

  const logsWithEmails = logs?.map(log => ({
    ...log,
    scanned_by_email: userMap.get(log.scanned_by) || 'Unknown',
  }));

  return NextResponse.json({ logs: logsWithEmails });
}

