'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { formatDateTime, formatDate, formatTime } from '@/utils/dateUtils';

interface Ticket {
  id: number;
  ticket_id: string;
  name: string;
  batch_id: string;
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

interface TicketBatch {
  batchId: string;
  guestName: string;
  tickets: Ticket[];
  totalTickets: number;
  usedTickets: number;
  unusedTickets: number;
  createdAt: string;
}

interface TicketWithScan extends Ticket {
  scanned_by_email?: string;
}

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketBatches, setTicketBatches] = useState<TicketBatch[]>([]);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedGuestQRs, setSelectedGuestQRs] = useState<Array<{qrCode: string; qrUrl: string; ticket: Ticket}>>([]);
  const [showModal, setShowModal] = useState(false);
  const [showScanLogs, setShowScanLogs] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);
  
  // Filters for all tickets view
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  
  const router = useRouter();
  const supabase = createClient();

  // Column resize handler
  const createResizableColumn = (e: React.MouseEvent<HTMLDivElement>) => {
    const th = (e.target as HTMLElement).parentElement as HTMLTableCellElement;
    const startX = e.clientX;
    const startWidth = th.offsetWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      th.style.width = `${Math.max(newWidth, 50)}px`;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  useEffect(() => {
    fetchTickets();
    fetchScanLogs();
  }, []);

  const fetchTickets = async () => {
    const response = await fetch('/api/tickets');
    const data = await response.json();
    if (data.tickets) {
      setTickets(data.tickets);
      groupTicketsByBatch(data.tickets);
    }
  };

  const groupTicketsByBatch = (allTickets: Ticket[]) => {
    const grouped: { [key: string]: Ticket[] } = {};
    
    allTickets.forEach(ticket => {
      if (!grouped[ticket.batch_id]) {
        grouped[ticket.batch_id] = [];
      }
      grouped[ticket.batch_id].push(ticket);
    });

    const batches: TicketBatch[] = Object.keys(grouped).map(batchId => {
      const batchTickets = grouped[batchId];
      return {
        batchId,
        guestName: batchTickets[0].name,
        tickets: batchTickets,
        totalTickets: batchTickets.length,
        usedTickets: batchTickets.filter(t => t.status === 'used').length,
        unusedTickets: batchTickets.filter(t => t.status === 'unused').length,
        createdAt: batchTickets[0].created_at,
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setTicketBatches(batches);
  };

  const fetchScanLogs = async () => {
    const response = await fetch('/api/scan-logs?type=valid');
    const data = await response.json();
    if (data.logs) {
      setScanLogs(data.logs);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Clear old QR codes and close modal immediately to prevent showing stale data
    setSelectedGuestQRs([]);
    setShowModal(false);

    try {
      const createdTickets: Array<{qrCode: string; qrUrl: string; ticket: Ticket}> = [];
      
      // Generate a single batch_id for all tickets in this creation
      const batchId = crypto.randomUUID();
      
      // Import QRCode library
      const QRCode = (await import('qrcode')).default;
      
      // Create multiple tickets for the same guest with same batch_id
      for (let i = 0; i < quantity; i++) {
        const response = await fetch('/api/tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, batch_id: batchId }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to create ticket');
          setLoading(false);
          return;
        }

        // Generate QR code on frontend with correct URL
        const appUrl = "https://eticket-roan.vercel.app/";
        const url = `${appUrl}validate/${data.ticket.ticket_id}`;
        const qr = await QRCode.toDataURL(url);
        
        createdTickets.push({
          qrCode: qr, // Use frontend-generated QR with correct URL
          qrUrl: url,
          ticket: data.ticket,
        });
      }

      // Show all created QR codes
      setSelectedGuestQRs(createdTickets);
      setShowModal(true);
      setName('');
      setQuantity(1);
      fetchTickets();
    } catch (err) {
      setError('Đã xảy ra lỗi không mong muốn');
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
    alert('Đã sao chép vào clipboard!');
  };

  const downloadSingleQR = async (item: {qrCode: string; qrUrl: string; ticket: Ticket}, index: number) => {
    const QRCode = (await import('qrcode')).default;
    
    // Generate high-resolution QR code (1024x1024)
    const highResQR = await QRCode.toDataURL(item.qrUrl, {
      width: 1024,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    
    // Create download link
    const link = document.createElement('a');
    link.href = highResQR;
    link.download = `${item.ticket.name}_ve_${index + 1}_${item.ticket.ticket_id.substring(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllQRCodes = async () => {
    for (let i = 0; i < selectedGuestQRs.length; i++) {
      const item = selectedGuestQRs[i];
      await downloadSingleQR(item, i);
      
      // Small delay between downloads to prevent browser blocking
      if (i < selectedGuestQRs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  };

  const getFilteredTickets = (): TicketWithScan[] => {
    // Add scan info to tickets
    const ticketsWithScan: TicketWithScan[] = tickets.map(ticket => {
      const scanLog = scanLogs.find(log => log.ticket_id === ticket.ticket_id);
      return {
        ...ticket,
        scanned_by_email: scanLog?.scanned_by_email,
      };
    });

    return ticketsWithScan.filter(ticket => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        ticket.name.toLowerCase().includes(searchLower) ||
        ticket.ticket_id.toLowerCase().includes(searchLower) ||
        (ticket.scanned_by_email && ticket.scanned_by_email.toLowerCase().includes(searchLower));

      // Status filter
      const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;

      // Date created filter
      const ticketDate = new Date(ticket.created_at);
      const matchesDateFrom = !filterDateFrom || ticketDate >= new Date(filterDateFrom);
      const matchesDateTo = !filterDateTo || ticketDate <= new Date(filterDateTo + 'T23:59:59');

      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  };

  const getQrCodesForBatch = async (batchId: string) => {
    // Clear old QR codes and close modal immediately to prevent showing stale data
    setSelectedGuestQRs([]);
    setShowModal(false);
    
    const appUrl = "https://eticket-roan.vercel.app/";
    const QRCode = (await import('qrcode')).default;
    
    const batchTickets = tickets.filter(t => t.batch_id === batchId);
    
    const qrCodes = await Promise.all(
      batchTickets.map(async (ticket) => {
        const url = `${appUrl}validate/${ticket.ticket_id}`;
        const qr = await QRCode.toDataURL(url);
        return { qrCode: qr, qrUrl: url, ticket };
      })
    );
    
    setSelectedGuestQRs(qrCodes);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Bảng Điều Khiển Quản Trị</h1>
              <p className="text-gray-600 mt-1">Quản lý vé sự kiện</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAllTickets(!showAllTickets);
                  if (!showAllTickets) fetchScanLogs();
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                {showAllTickets ? 'Ẩn' : 'Tất Cả'} Vé
              </button>
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
                {showScanLogs ? 'Ẩn' : 'Xem'} Lịch Sử Quét
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Đăng Xuất
              </button>
            </div>
          </div>
        </div>

        {/* Create Ticket Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Tạo Vé Mới</h2>
          <form onSubmit={handleCreateTicket}>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Khách
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên khách"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="w-40">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số Lượng Vé
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="100"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition whitespace-nowrap"
                >
                  {loading ? 'Đang tạo...' : `Tạo ${quantity} Vé`}
                </button>
              </div>
            </div>
          </form>
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Tickets by Guest */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Vé Theo Khách</h2>
            <button
              onClick={fetchTickets}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm Mới
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 relative" style={{ width: '250px' }}>
                    Tên Khách
                    <div onMouseDown={createResizableColumn} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500" />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 relative" style={{ width: '120px' }}>
                    Tổng
                    <div onMouseDown={createResizableColumn} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500" />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 relative" style={{ width: '120px' }}>
                    Đã Dùng
                    <div onMouseDown={createResizableColumn} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500" />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 relative" style={{ width: '120px' }}>
                    Chưa Dùng
                    <div onMouseDown={createResizableColumn} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500" />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700" style={{ width: '150px' }}>
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ticketBatches.map((batch, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap">
                      {batch.guestName}
                      <div className="text-xs text-gray-500 font-normal">
                        Tạo: {formatDate(batch.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-semibold">
                        {batch.totalTickets}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-semibold">
                        {batch.usedTickets}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-semibold">
                        {batch.unusedTickets}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => getQrCodesForBatch(batch.batchId)}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700 transition"
                      >
                        Xem Mã QR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ticketBatches.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Chưa có vé nào được tạo
              </div>
            )}
          </div>
        </div>

        {/* All Tickets Table with Filters */}
        {showAllTickets && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Tất Cả Vé</h2>
              <p className="text-sm text-gray-600">Tìm kiếm và lọc tất cả vé</p>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm Kiếm
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo tên, mã vé, hoặc người quét..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng Thái
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">Tất Cả</option>
                  <option value="unused">Chưa Dùng</option>
                  <option value="used">Đã Dùng</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Từ Ngày
                </label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đến Ngày
                </label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || filterStatus !== 'all' || filterDateFrom || filterDateTo) && (
              <div className="mb-4">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                    setFilterDateFrom('');
                    setFilterDateTo('');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}

            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600">
              Hiển thị {getFilteredTickets().length} / {tickets.length} vé
            </div>

            {/* All Tickets Table */}
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 relative" style={{ width: '200px' }}>
                      Tên Khách
                      <div onMouseDown={createResizableColumn} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500" />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 relative" style={{ width: '180px' }}>
                      Mã Vé
                      <div onMouseDown={createResizableColumn} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500" />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 relative" style={{ width: '120px' }}>
                      Trạng Thái
                      <div onMouseDown={createResizableColumn} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500" />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 relative" style={{ width: '180px' }}>
                      Quét Bởi
                      <div onMouseDown={createResizableColumn} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500" />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 relative" style={{ width: '160px' }}>
                      Ngày Tạo
                      <div onMouseDown={createResizableColumn} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500" />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700" style={{ width: '160px' }}>
                      Ngày Check-in
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {getFilteredTickets().map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap">
                        {ticket.name}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap" title={ticket.ticket_id}>
                        {ticket.ticket_id.substring(0, 13)}...
                      </td>
                      <td className="px-4 py-3 overflow-hidden text-ellipsis whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            ticket.status === 'used'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {ticket.status === 'used' ? 'ĐÃ DÙNG' : 'CHƯA DÙNG'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
                        {ticket.scanned_by_email || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
                        {formatDateTime(ticket.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
                        {ticket.checked_in_at
                          ? formatDateTime(ticket.checked_in_at)
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {getFilteredTickets().length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Không có vé nào phù hợp
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scan Logs */}
        {showScanLogs && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Lịch Sử Quét Vé</h2>
                <p className="text-sm text-gray-600 mt-1">Xem nhân viên nào quét vé nào</p>
              </div>
              <button
                onClick={fetchScanLogs}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Làm Mới
              </button>
            </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600 font-semibold">Tổng vé đã check-in</p>
                <p className="text-2xl font-bold text-green-800">
                  {scanLogs.length}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-semibold">Tổng vé đã bán</p>
                <p className="text-2xl font-bold text-blue-800">
                  {tickets.length}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 relative" style={{ width: '200px' }}>
                      Tên Khách
                      <div onMouseDown={createResizableColumn} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500" />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 relative" style={{ width: '150px' }}>
                      Mã Vé
                      <div onMouseDown={createResizableColumn} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500" />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 relative" style={{ width: '200px' }}>
                      Quét Bởi
                      <div onMouseDown={createResizableColumn} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500" />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 relative" style={{ width: '120px' }}>
                      Trạng Thái
                      <div onMouseDown={createResizableColumn} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500" />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700" style={{ width: '180px' }}>
                      Thời Gian Quét
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {scanLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap">{log.tickets.name}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
                        {log.ticket_id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 overflow-hidden text-ellipsis whitespace-nowrap">{log.scanned_by_email}</td>
                      <td className="px-4 py-3 overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          ĐÃ DUYỆT
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDateTime(log.scanned_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {scanLogs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Chưa có lịch sử quét
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* QR Codes Modal */}
      {showModal && selectedGuestQRs.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full my-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-semibold mb-2 text-gray-800">
                  Mã QR cho {selectedGuestQRs[0].ticket.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Tổng: {selectedGuestQRs.length} vé
                </p>
              </div>
              <button
                onClick={downloadAllQRCodes}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Tải Tất Cả QR
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
              {selectedGuestQRs.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col items-center">
                    <div className="mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.ticket.status === 'used'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.ticket.status === 'used' ? 'ĐÃ DÙNG' : 'CHƯA DÙNG'}
                      </span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.qrCode} alt="QR Code" className="w-48 h-48 mb-3" />
                    <div className="w-full">
                      <p className="text-xs text-gray-500 mb-1">Mã Vé:</p>
                      <p className="text-xs font-mono text-gray-600 mb-2 break-all">
                        {item.ticket.ticket_id}
                      </p>
                      {item.ticket.checked_in_at && (
                        <p className="text-xs text-gray-500">
                          Check-in lúc: {formatDateTime(item.ticket.checked_in_at)}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => downloadSingleQR(item, index)}
                          className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition flex items-center justify-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Tải QR
                        </button>
                        <button
                          onClick={() => window.open(item.qrUrl, '_blank')}
                          className="flex-1 bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 transition"
                        >
                          Mở vé
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedGuestQRs([]);
              }}
              className="mt-6 w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

