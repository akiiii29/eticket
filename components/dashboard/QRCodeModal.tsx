import React from "react";
import { Ticket } from "./types";

interface QRCodeModalProps {
    showModal: boolean;
    selectedGuestQRs: Array<{ qrCode: string; qrUrl: string; ticket: Ticket }>;
    setShowModal: (show: boolean) => void;
    setSelectedGuestQRs: (
        qrs: Array<{ qrCode: string; qrUrl: string; ticket: Ticket }>
    ) => void;
    downloadAllQRCodes: () => void;
    downloadSingleQR: (
        item: { qrCode: string; qrUrl: string; ticket: Ticket },
        index: number
    ) => void;
    formatDateTime: (date: string) => string;
}

export default function QRCodeModal({
    showModal,
    selectedGuestQRs,
    setShowModal,
    setSelectedGuestQRs,
    downloadAllQRCodes,
    downloadSingleQR,
    formatDateTime,
}: QRCodeModalProps) {
    if (!showModal || selectedGuestQRs.length === 0) return null;

    return (
        <div
            className="fixed inset-0 flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
        >
            <div
                className="card p-8 max-w-4xl w-full my-8"
                style={{ background: "var(--bg-surface)" }}
            >
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3
                            className="mb-2"
                            style={{
                                fontFamily: "Playfair Display, Georgia, serif",
                                fontSize: "2rem",
                                fontWeight: 500,
                                color: "var(--text-primary)",
                            }}
                        >
                            Mã QR cho {selectedGuestQRs[0].ticket.name}
                        </h3>
                        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                            Tổng: {selectedGuestQRs.length} vé
                        </p>
                    </div>
                    <button
                        onClick={downloadAllQRCodes}
                        className="btn-minimal flex items-center gap-2"
                        style={{
                            color: "var(--accent-green)",
                            borderColor: "var(--accent-green)",
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
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                        Tải Tất Cả QR
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                    {selectedGuestQRs.map((item, index) => (
                        <div
                            key={index}
                            className="card p-4"
                            style={{ borderColor: "var(--border-light)" }}
                        >
                            <div className="flex flex-col items-center">
                                <div className="mb-3">
                                    <span
                                        className={`badge ${item.ticket.status === "used" ? "badge-amber" : "badge-green"
                                            }`}
                                    >
                                        {item.ticket.status === "used" ? "Đã Dùng" : "Chưa Dùng"}
                                    </span>
                                </div>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={item.qrCode}
                                    alt="QR Code"
                                    className="w-40 h-40 sm:w-48 sm:h-48 mb-3"
                                    style={{ border: "1px solid var(--border-light)" }}
                                />
                                <div className="w-full">
                                    <p
                                        style={{
                                            fontSize: "0.8125rem",
                                            fontWeight: 500,
                                            letterSpacing: "0.05em",
                                            textTransform: "uppercase",
                                            color: "var(--text-secondary)",
                                            marginBottom: "0.25rem",
                                        }}
                                    >
                                        Mã Vé:
                                    </p>
                                    <p
                                        className="mb-2 break-all"
                                        style={{
                                            fontSize: "0.8125rem",
                                            fontFamily: "monospace",
                                            color: "var(--text-primary)",
                                        }}
                                    >
                                        {item.ticket.ticket_id}
                                    </p>
                                    {item.ticket.checked_in_at && (
                                        <p
                                            style={{
                                                fontSize: "0.8125rem",
                                                color: "var(--text-secondary)",
                                            }}
                                        >
                                            Check-in lúc: {formatDateTime(item.ticket.checked_in_at)}
                                        </p>
                                    )}
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => downloadSingleQR(item, index)}
                                            className="btn-minimal flex-1 flex items-center justify-center gap-1"
                                            style={{
                                                fontSize: "0.8125rem",
                                                color: "var(--accent-green)",
                                                borderColor: "var(--accent-green)",
                                            }}
                                        >
                                            <svg
                                                className="w-3 h-3"
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
                                            Tải QR
                                        </button>
                                        <button
                                            onClick={() => window.open(item.qrUrl, "_blank")}
                                            className="btn-minimal flex-1"
                                            style={{
                                                fontSize: "0.8125rem",
                                                color: "var(--text-secondary)",
                                                borderColor: "var(--border-light)",
                                            }}
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
                    className="btn-primary w-full mt-6"
                >
                    Đóng
                </button>
            </div>
        </div>
    );
}
