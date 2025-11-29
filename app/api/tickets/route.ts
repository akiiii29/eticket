import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getCachedUserProfile } from '@/utils/profileCache';

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use cached profile lookup instead of direct database query
  const role = await getCachedUserProfile(user.id);

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { name, batch_id } = body;

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  // Generate UUID for ticket
  const ticketId = crypto.randomUUID();

  // Use provided batch_id or generate new one
  const batchId = batch_id || crypto.randomUUID();

  // Insert ticket
  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      ticket_id: ticketId,
      name,
      batch_id: batchId,
      status: 'unused',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate QR code
  const appUrl = 'https://riseteam-ticket.vercel.app';
  const qrUrl = `${appUrl}/validate/${ticketId}`;
  const qrCode = await QRCode.toDataURL(qrUrl);

  return NextResponse.json({
    ticket,
    qrCode,
    qrUrl,
  });
}

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use cached profile lookup instead of direct database query
  const role = await getCachedUserProfile(user.id);

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const status = searchParams.get('status');
  const batchId = searchParams.get('batch_id');

  try {
    let query = supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add filters if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (batchId) {
      query = query.eq('batch_id', batchId);
    }

    const { data: tickets, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get total count for pagination (only if no filters applied for performance)
    let totalCount = null;
    if (!status && !batchId) {
      const { count } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true });
      totalCount = count;
    }

    return NextResponse.json({
      tickets: tickets || [],
      totalCount,
      hasMore: tickets && tickets.length === limit
    }, {
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
      },
    });
  } catch (err: any) {
    console.error('Tickets API error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
