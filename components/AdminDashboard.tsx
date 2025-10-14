'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface Ticket {
  id: number;
  ticket_id: string;
  name: string;
  status: string;
  created_at: string;
  checked_in_at: string | null;
}

interface ScanLog {
  id: number;
  ticket_id: string;
  scanned_by: string;
  scanned_by_email: string;
  status: string;
  scanned_at: string;
  tickets: {
    name: string;
    ticket_id: string;
  };
}

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showScanLogs, setShowScanLogs] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchTickets();
    fetchScanLogs();
  }, []);

  const fetchTickets = async () => {
    const response = await fetch('/api/tickets');
    const data = await response.json();
    if (data.tickets) {
      setTickets(data.tickets);
    }
  };

  const fetchScanLogs = async () => {
    const response = await fetch('/api/scan-logs?type=all');
    const data = await response.json();
    if (data.logs) {
      setScanLogs(data.logs);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create ticket');
        setLoading(false);
        return;
      }

      setQrCode(data.qrCode);
      setQrUrl(data.qrUrl);
      setShowModal(true);
      setName('');
      fetchTickets();
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getQrCodeForTicket = async (ticketId: string) => {
    const appUrl = "https://eticket-roan.vercel.app/"
    const url = `${appUrl}/validate/${ticketId}`;
    
    const QRCode = (await import('qrcode')).default;
    const qr = await QRCode.toDataURL(url);
    
    setQrCode(qr);
    setQrUrl(url);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage event tickets</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowScanLogs(!showScanLogs);
                  if (!showScanLogs) fetchScanLogs();
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {showScanLogs ? 'Hide' : 'View'} Scan Logs
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Create Ticket Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Create New Ticket</h2>
          <form onSubmit={handleCreateTicket} className="flex gap-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter guest name"
              required
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </form>
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">All Tickets</h2>
            <button
              onClick={fetchTickets}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ticket ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Created At</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Checked In At</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{ticket.name}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">
                      {ticket.ticket_id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          ticket.status === 'used'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {ticket.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(ticket.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {ticket.checked_in_at
                        ? new Date(ticket.checked_in_at).toLocaleString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => getQrCodeForTicket(ticket.ticket_id)}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700 transition"
                      >
                        View QR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tickets.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No tickets created yet
              </div>
            )}
          </div>
        </div>

        {/* Scan Logs */}
        {showScanLogs && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Scanned Tickets Log</h2>
                <p className="text-sm text-gray-600 mt-1">View which staff scanned which tickets</p>
              </div>
              <button
                onClick={fetchScanLogs}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600 font-semibold">Approved</p>
                <p className="text-2xl font-bold text-green-800">
                  {scanLogs.filter(log => log.status === 'valid').length}
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-600 font-semibold">Already Used</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {scanLogs.filter(log => log.status === 'already_used').length}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600 font-semibold">Denied</p>
                <p className="text-2xl font-bold text-red-800">
                  {scanLogs.filter(log => log.status === 'invalid' || log.status === 'error').length}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Guest Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ticket ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Scanned By</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Scanned At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {scanLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">{log.tickets.name}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-600">
                        {log.ticket_id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{log.scanned_by_email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            log.status === 'valid'
                              ? 'bg-green-100 text-green-800'
                              : log.status === 'already_used'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {log.status === 'valid' ? 'APPROVED' :
                           log.status === 'already_used' ? 'ALREADY USED' :
                           'DENIED'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(log.scanned_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {scanLogs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No scan logs yet
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">QR Code Generated</h3>
            <div className="flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="QR Code" className="w-64 h-64 mb-4" />
              <div className="w-full mb-4">
                <p className="text-sm text-gray-600 mb-2">QR URL:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(qrUrl)}
                    className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

