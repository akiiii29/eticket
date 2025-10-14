'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Ticket {
  id: number;
  ticket_id: string;
  name: string;
  batch_id: string;
  status: string;
  created_at: string;
  checked_in_at: string | null;
}

interface Props {
  ticket: Ticket;
  userRole: string | null;
  isAuthenticated: boolean;
}

export default function ValidateTicketClient({ ticket: initialTicket, userRole, isAuthenticated }: Props) {
  const [ticket, setTicket] = useState(initialTicket);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const statusColor = ticket.status === 'used' ? 'text-yellow-600' : 'text-green-600';
  const statusBg = ticket.status === 'used' ? 'bg-yellow-50' : 'bg-green-50';

  const canApprove = isAuthenticated && (userRole === 'staff' || userRole === 'admin') && ticket.status === 'unused';

  const handleApprove = async () => {
    if (!confirm(`Approve ticket for ${ticket.name}?`)) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticket_id: ticket.ticket_id }),
      });

      const data = await response.json();

      if (data.status === 'valid') {
        // Save to scan logs
        await fetch('/api/scan-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticket_id: ticket.ticket_id,
            status: 'valid',
          }),
        });

        setMessage('✅ Ticket approved successfully!');
        
        // Update ticket state
        setTicket({
          ...ticket,
          status: 'used',
          checked_in_at: new Date().toISOString(),
        });
      } else {
        setMessage(data.message || '❌ Failed to approve ticket');
      }
    } catch (err) {
      setMessage('❌ An error occurred');
    } finally {
      setLoading(false);
    }
  };

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
            <p className="text-xs font-mono text-gray-700 break-all">{ticket.ticket_id}</p>
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

        {/* Success/Error Message */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes('✅') 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Approve Button for Staff/Admin */}
        {canApprove && (
          <div className="mt-6">
            <button
              onClick={handleApprove}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-lg shadow-lg"
            >
              {loading ? 'Approving...' : '✅ Approve Ticket'}
            </button>
          </div>
        )}

        {ticket.status === 'used' && isAuthenticated && (
          <div className="mt-4 text-center">
            <p className="text-sm text-yellow-600 font-semibold">
              This ticket has already been checked in
            </p>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          This is a {ticket.status === 'unused' ? 'valid' : 'used'} ticket for internal check-in system
        </div>

        {/* Back to Dashboard */}
        {isAuthenticated && (
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push(userRole === 'admin' ? '/admin' : '/scanner')}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Back to {userRole === 'admin' ? 'Dashboard' : 'Scanner'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

