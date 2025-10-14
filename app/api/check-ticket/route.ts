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
  const { ticket_id } = body;

  if (!ticket_id) {
    return NextResponse.json(
      { error: 'Ticket ID is required' },
      { status: 400 }
    );
  }

  // Check if ticket exists and get its status (without updating)
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('ticket_id', ticket_id)
    .single();

  if (error || !ticket) {
    return NextResponse.json({
      exists: false,
      status: 'invalid',
      message: '❌ Invalid ticket',
    });
  }

  // Return ticket info without marking as used
  return NextResponse.json({
    exists: true,
    status: ticket.status,
    ticket: {
      id: ticket.ticket_id,
      name: ticket.name,
      status: ticket.status,
      checked_in_at: ticket.checked_in_at,
    },
  });
}

