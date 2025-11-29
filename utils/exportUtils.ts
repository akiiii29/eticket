// Export utilities for AdminDashboard
// Usage: import { exportToCSV, formatCurrency } from '@/utils/exportUtils';

export const TICKET_PRICE = 50000; // 50,000 VND per ticket

// Format Vietnamese currency
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
};

// Export tickets to Excel (HTML format with Times New Roman font)
export const exportTicketsToCSV = (tickets: any[]) => {
    const headers = ['Tên Khách', 'Mã Vé', 'Trạng Thái', 'Ngày Tạo', 'Ngày Check-in', 'Quét Bởi'];

    const rows = tickets.map(ticket => [
        ticket.name,
        ticket.ticket_id,
        ticket.status === 'used' ? 'Đã Dùng' : 'Chưa Dùng',
        new Date(ticket.created_at).toLocaleString('vi-VN'),
        ticket.checked_in_at ? new Date(ticket.checked_in_at).toLocaleString('vi-VN') : '-',
        ticket.scanned_by_email || '-'
    ]);

    downloadExcel(headers, rows, `tickets_${new Date().toISOString().split('T')[0]}.xls`);
};

// Export scan logs to Excel (HTML format with Times New Roman font)
export const exportScanLogsToCSV = (logs: any[]) => {
    const headers = ['Tên Khách', 'Mã Vé', 'Quét Bởi', 'Trạng Thái', 'Thời Gian Quét'];

    const rows = logs.map(log => [
        log.tickets.name,
        log.ticket_id,
        log.scanned_by_email,
        'Đã Duyệt',
        new Date(log.scanned_at).toLocaleString('vi-VN')
    ]);

    downloadExcel(headers, rows, `scan_logs_${new Date().toISOString().split('T')[0]}.xls`);
};

// Helper function to create Excel file with Times New Roman font
const downloadExcel = (headers: string[], rows: string[][], filename: string) => {
    // Create HTML table with Times New Roman font styling
    let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="utf-8">
            <!--[if gte mso 9]>
            <xml>
                <x:ExcelWorkbook>
                    <x:ExcelWorksheets>
                        <x:ExcelWorksheet>
                            <x:Name>Sheet1</x:Name>
                            <x:WorksheetOptions>
                                <x:DisplayGridlines/>
                            </x:WorksheetOptions>
                        </x:ExcelWorksheet>
                    </x:ExcelWorksheets>
                </x:ExcelWorkbook>
            </xml>
            <![endif]-->
            <style>
                table {
                    font-family: 'Times New Roman', Times, serif;
                    border-collapse: collapse;
                    width: 100%;
                }
                th, td {
                    border: 1px solid black;
                    padding: 8px;
                    text-align: left;
                    font-family: 'Times New Roman', Times, serif;
                }
                th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <table>
                <thead>
                    <tr>
                        ${headers.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr>
                            ${row.map(cell => `<td>${cell}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
