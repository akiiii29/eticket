import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';

export default async function ValidatePage({
  params,
}: {
  params: Promise<{ ticket_id: string }>;
}) {
  const { ticket_id } = await params;
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from('tickets')
    .select('*')
    .eq('ticket_id', ticket_id)
    .single();

  if (!ticket) {
    notFound();
  }

  const statusColor = ticket.status === 'used' ? 'text-yellow-600' : 'text-green-600';
  const statusBg = ticket.status === 'used' ? 'bg-yellow-50' : 'bg-green-50';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Ticket Information</h1>
        
        <div className="space-y-4">
          <div className="border-b pb-3">
            <p className="text-sm text-gray-600">Guest Name</p>
            <p className="text-lg font-semibold text-gray-800">{ticket.name}</p>
          </div>

          <div className="border-b pb-3">
            <p className="text-sm text-gray-600">Ticket ID</p>
            <p className="text-xs font-mono text-gray-700">{ticket.ticket_id}</p>
          </div>

          <div className="border-b pb-3">
            <p className="text-sm text-gray-600">Status</p>
            <p className={`text-lg font-semibold ${statusColor} ${statusBg} inline-block px-3 py-1 rounded-full`}>
              {ticket.status.toUpperCase()}
            </p>
          </div>

          <div className="border-b pb-3">
            <p className="text-sm text-gray-600">Created At</p>
            <p className="text-gray-700">{new Date(ticket.created_at).toLocaleString()}</p>
          </div>

          {ticket.checked_in_at && (
            <div className="border-b pb-3">
              <p className="text-sm text-gray-600">Checked In At</p>
              <p className="text-gray-700">{new Date(ticket.checked_in_at).toLocaleString()}</p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          This is a valid ticket for internal check-in system
        </div>
      </div>
    </div>
  );
}

