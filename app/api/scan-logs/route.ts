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

  try {
    let query = supabase
      .from('scan_logs')
      .select(`
        id,
        ticket_id,
        scanned_by,
        status,
        scanned_at,
        tickets(name, ticket_id)
      `)
      .order('scanned_at', { ascending: false });

    // If type is 'my', only get current user's scans
    if (type === 'my') {
      query = query.eq('scanned_by', user.id);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Scan logs query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get user emails using RPC function
    const logsWithEmails = await Promise.all(
      (logs || []).map(async (log) => {
        const { data: email } = await supabase
          .rpc('get_user_email', { user_id: log.scanned_by });
        
        return {
          ...log,
          scanned_by_email: email || `User ${log.scanned_by.substring(0, 8)}`,
        };
      })
    );

    return NextResponse.json({ logs: logsWithEmails });
  } catch (err: any) {
    console.error('Scan logs API error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

