import React from "react";
import { Ticket, TicketWithScan } from "./types";

interface AllTicketsTableProps {
    showAllTickets: boolean;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    filterDateFrom: string;
    setFilterDateFrom: (date: string) => void;
    filterDateTo: string;
    setFilterDateTo: (date: string) => void;
    getFilteredTickets: () => TicketWithScan[];
    tickets: Ticket[];
    ticketsLoading: boolean;
    createResizableColumn: (e: React.MouseEvent<HTMLDivElement>) => void;
    formatDateTime: (date: string) => string;
    exportTicketsToCSV: (tickets: TicketWithScan[]) => void;
}

export default function AllTicketsTable({
    showAllTickets,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterDateFrom,
    setFilterDateFrom,
    filterDateTo,
    setFilterDateTo,
    getFilteredTickets,
    tickets,
    ticketsLoading,
    createResizableColumn,
    formatDateTime,
    exportTicketsToCSV,
}: AllTicketsTableProps) {
    if (!showAllTickets) return null;

    return (
        <div className="card p-10 mb-12">
            <div className="flex justify-between items-start mb-10">
                <div>
                    <h2
                        className="text-2xl mb-2"
                        style={{
                            fontFamily: "Playfair Display, Georgia, serif",
                            fontWeight: 500,
                            color: "var(--text-primary)",
                        }}
                    >
                        Tất Cả Vé
                    </h2>
                    <p
                        className="text-sm"
                        style={{
                            color: "var(--text-secondary)",
                            letterSpacing: "0.02em",
                        }}
                    >
                        Tìm kiếm và lọc tất cả vé
                    </p>
                </div>
                <button
                    onClick={() => exportTicketsToCSV(getFilteredTickets())}
                    className="btn-minimal flex items-center gap-2 text-sm"
                    style={{
                        color: "var(--accent-green)",
                        borderColor: "var(--accent-green)",
                    }}
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                    </svg>
                    Xuất Excel
                </button>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="lg:col-span-2">
                    <label
                        className="block mb-2"
                        style={{
                            fontSize: "0.8125rem",
                            fontWeight: 500,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            color: "var(--text-secondary)",
                        }}
                    >
                        Tìm Kiếm
                    </label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm theo tên, mã vé, hoặc người quét..."
                        className="input-minimal w-full"
                    />
                </div>

                <div>
                    <label
                        className="block mb-2"
                        style={{
                            fontSize: "0.8125rem",
                            fontWeight: 500,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            color: "var(--text-secondary)",
                        }}
                    >
                        Trạng Thái
                    </label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="input-minimal w-full"
                    >
                        <option value="all">Tất Cả</option>
                        <option value="unused">Chưa Dùng</option>
                        <option value="used">Đã Dùng</option>
                    </select>
                </div>

                <div>
                    <label
                        className="block mb-2"
                        style={{
                            fontSize: "0.8125rem",
                            fontWeight: 500,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            color: "var(--text-secondary)",
                        }}
                    >
                        Từ Ngày
                    </label>
                    <input
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        className="input-minimal w-full"
                    />
                </div>

                <div>
                    <label
                        className="block mb-2"
                        style={{
                            fontSize: "0.8125rem",
                            fontWeight: 500,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            color: "var(--text-secondary)",
                        }}
                    >
                        Đến Ngày
                    </label>
                    <input
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                        className="input-minimal w-full"
                    />
                </div>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm ||
                filterStatus !== "all" ||
                filterDateFrom ||
                filterDateTo) && (
                    <div className="mb-4">
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setFilterStatus("all");
                                setFilterDateFrom("");
                                setFilterDateTo("");
                            }}
                            className="btn-minimal"
                            style={{
                                fontSize: "0.875rem",
                                color: "var(--text-secondary)",
                            }}
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                )}

            {/* Results Count */}
            <div className="mb-4" style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                Hiển thị {getFilteredTickets().length} / {tickets.length} vé
            </div>

            {/* All Tickets Table */}
            <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full table-fixed min-w-[720px]">
                    <thead>
                        <tr>
                            <th className="relative" style={{ width: "200px" }}>
                                Tên Khách
                                <div
                                    onMouseDown={createResizableColumn}
                                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize"
                                    style={{ background: "transparent" }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.background = "var(--border-medium)")
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.background = "transparent")
                                    }
                                />
                            </th>
                            <th className="relative" style={{ width: "180px" }}>
                                Mã Vé
                                <div
                                    onMouseDown={createResizableColumn}
                                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize"
                                    style={{ background: "transparent" }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.background = "var(--border-medium)")
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.background = "transparent")
                                    }
                                />
                            </th>
                            <th className="relative" style={{ width: "120px" }}>
                                Trạng Thái
                                <div
                                    onMouseDown={createResizableColumn}
                                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize"
                                    style={{ background: "transparent" }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.background = "var(--border-medium)")
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.background = "transparent")
                                    }
                                />
                            </th>
                            <th className="relative" style={{ width: "180px" }}>
                                Quét Bởi
                                <div
                                    onMouseDown={createResizableColumn}
                                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize"
                                    style={{ background: "transparent" }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.background = "var(--border-medium)")
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.background = "transparent")
                                    }
                                />
                            </th>
                            <th className="relative" style={{ width: "160px" }}>
                                Ngày Tạo
                                <div
                                    onMouseDown={createResizableColumn}
                                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize"
                                    style={{ background: "transparent" }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.background = "var(--border-medium)")
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.background = "transparent")
                                    }
                                />
                            </th>
                            <th style={{ width: "160px" }}>Ngày Check-in</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ticketsLoading &&
                            Array.from({ length: 8 }).map((_, i) => (
                                <tr key={`all-skeleton-${i}`}>
                                    <td>
                                        <div className="skeleton h-4 rounded w-40"></div>
                                    </td>
                                    <td>
                                        <div className="skeleton h-3 rounded w-32"></div>
                                    </td>
                                    <td>
                                        <div className="skeleton h-5 rounded w-20"></div>
                                    </td>
                                    <td>
                                        <div className="skeleton h-4 rounded w-44"></div>
                                    </td>
                                    <td>
                                        <div className="skeleton h-4 rounded w-36"></div>
                                    </td>
                                    <td>
                                        <div className="skeleton h-4 rounded w-36"></div>
                                    </td>
                                </tr>
                            ))}
                        {!ticketsLoading &&
                            getFilteredTickets().map((ticket) => (
                                <tr key={ticket.id}>
                                    <td style={{ color: "var(--text-primary)" }}>
                                        {ticket.name}
                                    </td>
                                    <td
                                        title={ticket.ticket_id}
                                        style={{
                                            fontSize: "0.8125rem",
                                            fontFamily: "monospace",
                                            color: "var(--text-secondary)",
                                        }}
                                    >
                                        {ticket.ticket_id.substring(0, 13)}...
                                    </td>
                                    <td>
                                        <span
                                            className={`badge ${ticket.status === "used" ? "badge-amber" : "badge-green"
                                                }`}
                                        >
                                            {ticket.status === "used" ? "Đã Dùng" : "Chưa Dùng"}
                                        </span>
                                    </td>
                                    <td style={{ color: "var(--text-secondary)" }}>
                                        {ticket.scanned_by_email || "-"}
                                    </td>
                                    <td style={{ color: "var(--text-secondary)" }}>
                                        {formatDateTime(ticket.created_at)}
                                    </td>
                                    <td style={{ color: "var(--text-secondary)" }}>
                                        {ticket.checked_in_at
                                            ? formatDateTime(ticket.checked_in_at)
                                            : "-"}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
                {!ticketsLoading && getFilteredTickets().length === 0 && (
                    <div
                        className="text-center py-8"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        Không có vé nào phù hợp
                    </div>
                )}
            </div>
        </div>
    );
}
