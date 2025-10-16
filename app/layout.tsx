import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rise Team Ticket Check-in",
  description: "Rise Team Ticket Check-in System",
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

