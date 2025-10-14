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

  // Update to used
  const { data: updatedTicket, error: updateError } = await supabase
    .from('tickets')
    .update({
      status: 'used',
      checked_in_at: new Date().toISOString(),
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

  // Automatically create scan log for approved ticket
  const { error: logError } = await supabase
    .from('scan_logs')
    .insert({
      ticket_id: ticket_id,
      scanned_by: user.id,
      status: 'valid',
    });

  if (logError) {
    console.error('Failed to create scan log:', logError);
    // Don't fail the request if logging fails, but log the error
  }

  return NextResponse.json({
    message: '✅ Valid ticket',
    status: 'valid',
    ticket: updatedTicket,
  });
}

