import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-Ticket Check-in System",
  description: "Internal ticket check-in system with QR validation",
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

