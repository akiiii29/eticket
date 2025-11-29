import React from "react";
import { TicketBatch } from "./types";

interface StatsCardsProps {
    totalTickets: number;
    usedTickets: number;
    unusedTickets: number;
    ticketBatches: TicketBatch[];
    formatCurrency: (amount: number) => string;
    TICKET_PRICE: number;
}

export default function StatsCards({
    totalTickets,
    usedTickets,
    unusedTickets,
    ticketBatches,
    formatCurrency,
    TICKET_PRICE,
}: StatsCardsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            <div className="stat-card">
                <div className="stat-label">Tổng Vé</div>
                <div className="stat-number" style={{ color: "var(--text-primary)" }}>
                    {totalTickets}
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-label">Đã Dùng</div>
                <div className="stat-number" style={{ color: "var(--accent-amber)" }}>
                    {usedTickets}
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-label">Còn Lại</div>
                <div className="stat-number" style={{ color: "var(--accent-green)" }}>
                    {unusedTickets}
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-label">Khách</div>
                <div className="stat-number" style={{ color: "var(--text-primary)" }}>
                    {ticketBatches.length}
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-label">Doanh Thu</div>
                <div
                    className="stat-number"
                    style={{ color: "var(--accent-blue)", fontSize: "2rem" }}
                >
                    {formatCurrency(totalTickets * TICKET_PRICE)}
                </div>
            </div>
        </div>
    );
}
