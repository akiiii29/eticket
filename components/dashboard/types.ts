export interface Ticket {
    id: number;
    ticket_id: string;
    name: string;
    batch_id: string;
    status: string;
    created_at: string;
    checked_in_at: string | null;
}

export interface ScanLog {
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

export interface TicketBatch {
    batchId: string;
    guestName: string;
    tickets: Ticket[];
    totalTickets: number;
    usedTickets: number;
    unusedTickets: number;
    createdAt: string;
}

export interface TicketWithScan extends Ticket {
    scanned_by_email?: string;
}
