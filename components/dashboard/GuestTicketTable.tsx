import React from "react";
import { TicketBatch } from "./types";

interface GuestTicketTableProps {
    ticketsLoading: boolean;
    ticketBatches: TicketBatch[];
    getQrCodesForBatch: (batchId: string) => void;
    formatDate: (date: string) => string;
    createResizableColumn: (e: React.MouseEvent<HTMLDivElement>) => void;
    fetchTickets: () => void;
}

export default function GuestTicketTable({
    ticketsLoading,
    ticketBatches,
    getQrCodesForBatch,
    formatDate,
    createResizableColumn,
    fetchTickets,
}: GuestTicketTableProps) {
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
                        Vé Theo Khách
                    </h2>
                    <p
                        className="text-sm"
                        style={{
                            color: "var(--text-secondary)",
                            letterSpacing: "0.02em",
                        }}
                    >
                        Quản lý vé theo từng khách hàng
                    </p>
                </div>
                <button
                    onClick={() => fetchTickets()}
                    disabled={ticketsLoading}
                    className="btn-minimal flex items-center gap-2"
                    style={{
                        color: ticketsLoading
                            ? "var(--text-tertiary)"
                            : "var(--accent-primary)",
                        cursor: ticketsLoading ? "not-allowed" : "pointer",
                    }}
                >
                    {ticketsLoading ? (
                        <svg
                            className="w-4 h-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                d="M4 12a8 8 0 018-8"
                                strokeWidth="4"
                            ></path>
                        </svg>
                    ) : (
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
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                    )}
                    {ticketsLoading ? "Đang tải..." : "Làm Mới"}
                </button>
            </div>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full table-fixed min-w-[640px]">
                    <thead>
                        <tr>
                            <th className="relative" style={{ width: "250px" }}>
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
                            <th className="relative" style={{ width: "120px" }}>
                                Tổng
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
                                Đã Dùng
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
                                Chưa Dùng
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
                            <th style={{ width: "150px" }}>Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ticketsLoading &&
                            ticketBatches.length === 0 &&
                            Array.from({ length: 6 }).map((_, i) => (
                                <tr key={`skeleton-${i}`}>
                                    <td>
                                        <div className="skeleton h-4 rounded w-40 mb-2"></div>
                                        <div className="skeleton h-3 rounded w-24"></div>
                                    </td>
                                    <td>
                                        <div className="skeleton h-5 rounded w-12"></div>
                                    </td>
                                    <td>
                                        <div className="skeleton h-5 rounded w-12"></div>
                                    </td>
                                    <td>
                                        <div className="skeleton h-5 rounded w-12"></div>
                                    </td>
                                    <td>
                                        <div className="skeleton h-8 rounded w-20"></div>
                                    </td>
                                </tr>
                            ))}
                        {!ticketsLoading &&
                            ticketBatches.map((batch, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                                            {batch.guestName}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "0.8125rem",
                                                color: "var(--text-secondary)",
                                                marginTop: "0.25rem",
                                            }}
                                        >
                                            Tạo: {formatDate(batch.createdAt)}
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className="badge"
                                            style={{
                                                background: "var(--bg-surface)",
                                                color: "var(--text-primary)",
                                                border: "1px solid var(--border-light)",
                                            }}
                                        >
                                            {batch.totalTickets}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge badge-amber">{batch.usedTickets}</span>
                                    </td>
                                    <td>
                                        <span className="badge badge-green">{batch.unusedTickets}</span>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => getQrCodesForBatch(batch.batchId)}
                                            className="btn-minimal"
                                            style={{
                                                color: "var(--accent-primary)",
                                                borderColor: "var(--border-light)",
                                            }}
                                        >
                                            Xem Mã QR
                                        </button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
                {!ticketsLoading && ticketBatches.length === 0 && (
                    <div
                        className="text-center py-8"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        Chưa có vé nào được tạo
                    </div>
                )}
            </div>
        </div>
    );
}
