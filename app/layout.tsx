import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hệ Thống E-Ticket Check-in",
  description: "Hệ thống check-in vé nội bộ với xác thực QR",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

