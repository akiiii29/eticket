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
      { error: 'Ticket ID is required', status: 'error' },
      { status: 400 }
    );
  }

  // Check if ticket exists
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('ticket_id', ticket_id)
    .single();

  if (error || !ticket) {
    return NextResponse.json({
      message: '❌ Invalid ticket',
      status: 'invalid',
    });
  }

  // Check if already used
  if (ticket.status === 'used') {
    return NextResponse.json({
      message: '⚠️ Already checked in',
      status: 'already_used',
      ticket,
    });
  }

  // Generate a single timestamp for both checked_in_at and scanned_at
  const checkInTime = new Date().toISOString();

  // Update to used
  const { data: updatedTicket, error: updateError } = await supabase
    .from('tickets')
    .update({
      status: 'used',
      checked_in_at: checkInTime,
    })
    .eq('ticket_id', ticket_id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message, status: 'error' },
      { status: 500 }
    );
  }

  // Create scan log asynchronously (fire-and-forget for better performance)
  // Don't await this - let it happen in the background
  supabase
    .from('scan_logs')
    .insert({
      ticket_id: ticket_id,
      scanned_by: user.id,
      status: 'valid',
      scanned_at: checkInTime,
    })
    .then(({ error: logError }) => {
      if (logError) {
        console.error('Failed to create scan log:', logError);
      }
    });

  // Return immediately without waiting for scan log
  return NextResponse.json({
    message: '✅ Valid ticket',
    status: 'valid',
    ticket: updatedTicket,
  });
}

