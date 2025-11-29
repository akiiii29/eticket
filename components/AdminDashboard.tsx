"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { formatDateTime, formatDate } from "@/utils/dateUtils";
import {
  exportTicketsToCSV,
  exportScanLogsToCSV,
  formatCurrency,
  TICKET_PRICE,
} from "@/utils/exportUtils";
import { generateBrandedQR } from "@/utils/qrUtils";
import {
  Ticket,
  ScanLog,
  TicketBatch,
  TicketWithScan,
} from "./dashboard/types";
import DashboardHeader from "./dashboard/DashboardHeader";
import StatsCards from "./dashboard/StatsCards";
import CreateTicketForm from "./dashboard/CreateTicketForm";
import GuestTicketTable from "./dashboard/GuestTicketTable";
import AllTicketsTable from "./dashboard/AllTicketsTable";
import ScanLogsTable from "./dashboard/ScanLogsTable";
import QRCodeModal from "./dashboard/QRCodeModal";

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketBatches, setTicketBatches] = useState<TicketBatch[]>([]);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedGuestQRs, setSelectedGuestQRs] = useState<
    Array<{ qrCode: string; qrUrl: string; ticket: Ticket }>
  >([]);
  const [showModal, setShowModal] = useState(false);
  const [showScanLogs, setShowScanLogs] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [scanLogsLoading, setScanLogsLoading] = useState(false);

  // Filters for all tickets view
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const router = useRouter();
  const supabase = createClient();

  const quantityNumber = parseInt(quantity || "0", 10) || 0;

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
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  useEffect(() => {
    fetchTickets();
    fetchScanLogs();

    // Real-time stats auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTickets();
      if (showScanLogs) {
        fetchScanLogs();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [showScanLogs]);

  const fetchTickets = async (page = 0, limit = 100) => {
    if (page === 0) setTicketsLoading(true);
    try {
      const response = await fetch(
        `/api/tickets?limit=${limit}&offset=${page * limit}`
      );
      const data = await response.json();
      if (data.tickets) {
        if (page === 0) {
          // First page - replace all tickets
          setTickets(data.tickets);
        } else {
          // Subsequent pages - append to existing tickets
          setTickets((prev) => [...prev, ...data.tickets]);
        }
        groupTicketsByBatch(data.tickets);
      }
    } finally {
      if (page === 0) setTicketsLoading(false);
    }
  };

  const groupTicketsByBatch = (allTickets: Ticket[]) => {
    const grouped: { [key: string]: Ticket[] } = {};

    allTickets.forEach((ticket) => {
      if (!grouped[ticket.batch_id]) {
        grouped[ticket.batch_id] = [];
      }
      grouped[ticket.batch_id].push(ticket);
    });

    const batches: TicketBatch[] = Object.keys(grouped)
      .map((batchId) => {
        const batchTickets = grouped[batchId];
        return {
          batchId,
          guestName: batchTickets[0].name,
          tickets: batchTickets,
          totalTickets: batchTickets.length,
          usedTickets: batchTickets.filter((t) => t.status === "used").length,
          unusedTickets: batchTickets.filter((t) => t.status === "unused")
            .length,
          createdAt: batchTickets[0].created_at,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    setTicketBatches(batches);
  };

  const fetchScanLogs = async (page = 0, limit = 50) => {
    if (page === 0) setScanLogsLoading(true);
    try {
      const response = await fetch(
        `/api/scan-logs?type=valid&limit=${limit}&offset=${page * limit}`
      );
      const data = await response.json();
      if (data.logs) {
        if (page === 0) {
          // First page - replace all logs
          setScanLogs(data.logs);
        } else {
          // Subsequent pages - append to existing logs
          setScanLogs((prev) => [...prev, ...data.logs]);
        }
      }
    } finally {
      if (page === 0) setScanLogsLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate quantity must be at least 1
    if (quantityNumber < 1) {
      setError("Số lượng vé phải lớn hơn hoặc bằng 1");
      return;
    }

    setLoading(true);

    // Clear old QR codes and close modal immediately to prevent showing stale data
    setSelectedGuestQRs([]);
    setShowModal(false);

    try {
      const createdTickets: Array<{
        qrCode: string;
        qrUrl: string;
        ticket: Ticket;
      }> = [];

      // Generate a single batch_id for all tickets in this creation
      const batchId = crypto.randomUUID();

      // Create multiple tickets for the same guest with same batch_id
      for (let i = 0; i < quantityNumber; i++) {
        const response = await fetch("/api/tickets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, batch_id: batchId }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to create ticket");
          setLoading(false);
          return;
        }

        // Generate QR code on frontend with correct URL
        const appUrl = "https://riseteam-ticket.vercel.app/";
        const url = `${appUrl}validate/${data.ticket.ticket_id}`;
        const qr = await generateBrandedQR(url, 512);

        createdTickets.push({
          qrCode: qr, // Use frontend-generated QR with correct URL
          qrUrl: url,
          ticket: data.ticket,
        });
      }

      // Show all created QR codes
      setSelectedGuestQRs(createdTickets);
      setShowModal(true);
      setName("");
      setQuantity("");
      fetchTickets();
    } catch (err) {
      setError("Đã xảy ra lỗi không mong muốn");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const downloadSingleQR = async (
    item: { qrCode: string; qrUrl: string; ticket: Ticket },
    index: number
  ) => {
    // Generate high-resolution branded QR (1024x1024)
    const highResQR = await generateBrandedQR(item.qrUrl, 1024);

    // Create download link
    const link = document.createElement("a");
    link.href = highResQR;
    link.download = `${item.ticket.name}_ve_${index + 1}_${item.ticket.ticket_id.substring(
      0,
      8
    )}.png`;
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
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  };

  const getFilteredTickets = (): TicketWithScan[] => {
    // Add scan info to tickets
    const ticketsWithScan: TicketWithScan[] = tickets.map((ticket) => {
      const scanLog = scanLogs.find(
        (log) => log.ticket_id === ticket.ticket_id
      );
      return {
        ...ticket,
        scanned_by_email: scanLog?.scanned_by_email,
      };
    });

    return ticketsWithScan.filter((ticket) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        ticket.name.toLowerCase().includes(searchLower) ||
        ticket.ticket_id.toLowerCase().includes(searchLower) ||
        (ticket.scanned_by_email &&
          ticket.scanned_by_email.toLowerCase().includes(searchLower));

      // Status filter
      const matchesStatus =
        filterStatus === "all" || ticket.status === filterStatus;

      // Date created filter
      const ticketDate = new Date(ticket.created_at);
      const matchesDateFrom =
        !filterDateFrom || ticketDate >= new Date(filterDateFrom);
      const matchesDateTo =
        !filterDateTo || ticketDate <= new Date(filterDateTo + "T23:59:59");

      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  };

  const getQrCodesForBatch = async (batchId: string) => {
    // Clear old QR codes and close modal immediately to prevent showing stale data
    setSelectedGuestQRs([]);
    setShowModal(false);

    const appUrl = "https://riseteam-ticket.vercel.app/";

    const batchTickets = tickets.filter((t) => t.batch_id === batchId);

    const qrCodes = await Promise.all(
      batchTickets.map(async (ticket) => {
        const url = `${appUrl}validate/${ticket.ticket_id}`;
        const qr = await generateBrandedQR(url, 512);
        return { qrCode: qr, qrUrl: url, ticket };
      })
    );

    setSelectedGuestQRs(qrCodes);
    setShowModal(true);
  };

  // Calculate statistics
  const totalTickets = ticketBatches.reduce(
    (sum, batch) => sum + batch.totalTickets,
    0
  );
  const usedTickets = ticketBatches.reduce(
    (sum, batch) => sum + batch.usedTickets,
    0
  );
  const unusedTickets = ticketBatches.reduce(
    (sum, batch) => sum + batch.unusedTickets,
    0
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #E7F5FF 0%, #F8F9FA 100%)" }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <DashboardHeader
          showAllTickets={showAllTickets}
          setShowAllTickets={setShowAllTickets}
          showScanLogs={showScanLogs}
          setShowScanLogs={setShowScanLogs}
          handleLogout={handleLogout}
          fetchScanLogs={fetchScanLogs}
        />

        <StatsCards
          totalTickets={totalTickets}
          usedTickets={usedTickets}
          unusedTickets={unusedTickets}
          ticketBatches={ticketBatches}
          formatCurrency={formatCurrency}
          TICKET_PRICE={TICKET_PRICE}
        />

        <CreateTicketForm
          name={name}
          setName={setName}
          quantity={quantity}
          setQuantity={setQuantity}
          quantityNumber={quantityNumber}
          loading={loading}
          handleCreateTicket={handleCreateTicket}
          error={error}
        />

        <GuestTicketTable
          ticketsLoading={ticketsLoading}
          ticketBatches={ticketBatches}
          getQrCodesForBatch={getQrCodesForBatch}
          formatDate={formatDate}
          createResizableColumn={createResizableColumn}
          fetchTickets={fetchTickets}
        />

        <AllTicketsTable
          showAllTickets={showAllTickets}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterDateFrom={filterDateFrom}
          setFilterDateFrom={setFilterDateFrom}
          filterDateTo={filterDateTo}
          setFilterDateTo={setFilterDateTo}
          getFilteredTickets={getFilteredTickets}
          tickets={tickets}
          ticketsLoading={ticketsLoading}
          createResizableColumn={createResizableColumn}
          formatDateTime={formatDateTime}
          exportTicketsToCSV={exportTicketsToCSV}
        />

        <ScanLogsTable
          showScanLogs={showScanLogs}
          scanLogs={scanLogs}
          scanLogsLoading={scanLogsLoading}
          fetchScanLogs={fetchScanLogs}
          exportScanLogsToCSV={exportScanLogsToCSV}
          tickets={tickets}
          createResizableColumn={createResizableColumn}
          formatDateTime={formatDateTime}
        />

        <QRCodeModal
          showModal={showModal}
          selectedGuestQRs={selectedGuestQRs}
          setShowModal={setShowModal}
          setSelectedGuestQRs={setSelectedGuestQRs}
          downloadAllQRCodes={downloadAllQRCodes}
          downloadSingleQR={downloadSingleQR}
          formatDateTime={formatDateTime}
        />
      </div>
    </div>
  );
}
