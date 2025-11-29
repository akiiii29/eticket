import React from "react";
import { ScanLog, Ticket } from "./types";

interface ScanLogsTableProps {
    showScanLogs: boolean;
    scanLogs: ScanLog[];
    scanLogsLoading: boolean;
    fetchScanLogs: () => void;
    exportScanLogsToCSV: (logs: ScanLog[]) => void;
    tickets: Ticket[];
    createResizableColumn: (e: React.MouseEvent<HTMLDivElement>) => void;
    formatDateTime: (date: string) => string;
}

export default function ScanLogsTable({
    showScanLogs,
    scanLogs,
    scanLogsLoading,
    fetchScanLogs,
    exportScanLogsToCSV,
    tickets,
    createResizableColumn,
    formatDateTime,
}: ScanLogsTableProps) {
    if (!showScanLogs) return null;

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
                        Lịch Sử Quét Vé
                    </h2>
                    <p
                        className="text-sm"
                        style={{
                            color: "var(--text-secondary)",
                            letterSpacing: "0.02em",
                        }}
                    >
                        Xem nhân viên nào quét vé nào
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => exportScanLogsToCSV(scanLogs)}
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
                    <button
                        onClick={() => fetchScanLogs()}
                        disabled={scanLogsLoading}
                        className="btn-minimal flex items-center gap-2"
                        style={{
                            color: scanLogsLoading
                                ? "var(--text-tertiary)"
                                : "var(--accent-primary)",
                            cursor: scanLogsLoading ? "not-allowed" : "pointer",
                        }}
                    >
                        {scanLogsLoading ? (
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
                        {scanLogsLoading ? "Đang tải..." : "Làm Mới"}
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div
                    className="card p-4"
                    style={{
                        background: "rgba(74, 124, 89, 0.05)",
                        borderColor: "var(--accent-green)",
                    }}
                >
                    <p
                        style={{
                            fontSize: "0.8125rem",
                            fontWeight: 500,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            color: "var(--accent-green)",
                            marginBottom: "0.5rem",
                        }}
                    >
                        Tổng vé đã check-in
                    </p>
                    <p
                        style={{
                            fontFamily: "Playfair Display, Georgia, serif",
                            fontSize: "2rem",
                            fontWeight: 500,
                            color: "var(--accent-green)",
                        }}
                    >
                        {scanLogs.length}
                    </p>
                </div>
                <div
                    className="card p-4"
                    style={{
                        background: "var(--bg-surface)",
                        borderColor: "var(--border-light)",
                    }}
                >
                    <p
                        style={{
                            fontSize: "0.8125rem",
                            fontWeight: 500,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            color: "var(--text-secondary)",
                            marginBottom: "0.5rem",
                        }}
                    >
                        Tổng vé đã bán
                    </p>
                    <p
                        style={{
                            fontFamily: "Playfair Display, Georgia, serif",
                            fontSize: "2rem",
                            fontWeight: 500,
                            color: "var(--text-primary)",
                        }}
                    >
                        {tickets.length}
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full table-fixed min-w-[640px]">
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
                            <th className="relative" style={{ width: "150px" }}>
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
                            <th className="relative" style={{ width: "200px" }}>
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
                            <th style={{ width: "180px" }}>Thời Gian Quét</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scanLogsLoading &&
                            Array.from({ length: 8 }).map((_, i) => (
                                <tr key={`logs-skeleton-${i}`}>
                                    <td>
                                        <div className="skeleton h-4 rounded w-40"></div>
                                    </td>
                                    <td>
                                        <div className="skeleton h-3 rounded w-24"></div>
                                    </td>
                                    <td>
                                        <div className="skeleton h-4 rounded w-44"></div>
                                    </td>
                                    <td>
                                        <div className="skeleton h-5 rounded w-20"></div>
                                    </td>
                                    <td>
                                        <div className="skeleton h-4 rounded w-36"></div>
                                    </td>
                                </tr>
                            ))}
                        {!scanLogsLoading &&
                            scanLogs.map((log) => (
                                <tr key={log.id}>
                                    <td style={{ color: "var(--text-primary)" }}>
                                        {log.tickets.name}
                                    </td>
                                    <td
                                        style={{
                                            fontSize: "0.8125rem",
                                            fontFamily: "monospace",
                                            color: "var(--text-secondary)",
                                        }}
                                    >
                                        {log.ticket_id.substring(0, 8)}...
                                    </td>
                                    <td style={{ color: "var(--text-secondary)" }}>
                                        {log.scanned_by_email}
                                    </td>
                                    <td>
                                        <span className="badge badge-green">Đã Duyệt</span>
                                    </td>
                                    <td style={{ color: "var(--text-secondary)" }}>
                                        {formatDateTime(log.scanned_at)}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
                {!scanLogsLoading && scanLogs.length === 0 && (
                    <div
                        className="text-center py-8"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        Chưa có lịch sử quét
                    </div>
                )}
            </div>
        </div>
    );
}
