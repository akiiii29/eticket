import React from "react";

interface DashboardHeaderProps {
    showAllTickets: boolean;
    setShowAllTickets: (show: boolean) => void;
    showScanLogs: boolean;
    setShowScanLogs: (show: boolean) => void;
    handleLogout: () => void;
    fetchScanLogs: () => void;
}

export default function DashboardHeader({
    showAllTickets,
    setShowAllTickets,
    showScanLogs,
    setShowScanLogs,
    handleLogout,
    fetchScanLogs,
}: DashboardHeaderProps) {
    return (
        <div className="card p-10 mb-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1
                        className="mb-2"
                        style={{
                            fontFamily: "Playfair Display, Georgia, serif",
                            fontSize: "2.5rem",
                            fontWeight: 500,
                            letterSpacing: "-0.02em",
                            color: "var(--text-primary)",
                        }}
                    >
                        Rise Team Ticket Check-in
                    </h1>
                    <p
                        style={{
                            color: "var(--text-secondary)",
                            letterSpacing: "0.02em",
                        }}
                    >
                        Quản lý vé sự kiện
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 justify-start lg:justify-end">
                    <button
                        onClick={() => {
                            setShowAllTickets(!showAllTickets);
                            if (!showAllTickets) fetchScanLogs();
                        }}
                        className="btn-minimal flex items-center gap-2"
                        style={{
                            color: showAllTickets
                                ? "var(--accent-primary)"
                                : "var(--text-secondary)",
                            borderColor: showAllTickets
                                ? "var(--border-medium)"
                                : "var(--border-light)",
                        }}
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 10h16M4 14h16M4 18h16"
                            />
                        </svg>
                        {showAllTickets ? "Ẩn" : "Tất Cả"} Vé
                    </button>
                    <button
                        onClick={() => {
                            setShowScanLogs(!showScanLogs);
                            if (!showScanLogs) fetchScanLogs();
                        }}
                        className="btn-minimal flex items-center gap-2"
                        style={{
                            color: showScanLogs
                                ? "var(--accent-primary)"
                                : "var(--text-secondary)",
                            borderColor: showScanLogs
                                ? "var(--border-medium)"
                                : "var(--border-light)",
                        }}
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        {showScanLogs ? "Ẩn" : "Xem"} Lịch Sử Quét
                    </button>
                    <button
                        onClick={handleLogout}
                        className="btn-minimal flex items-center gap-2"
                        style={{
                            color: "var(--accent-red)",
                            borderColor: "var(--accent-red)",
                        }}
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                        </svg>
                        Đăng Xuất
                    </button>
                </div>
            </div>
        </div>
    );
}
