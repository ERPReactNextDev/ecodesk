import React, { Suspense } from "react";

import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "@/contexts/UserContext";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Reminders } from "@/components/reminders";
import { TicketReceived } from "@/components/popup-ticket-received";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // add this if missing, for better font loading
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});
export const metadata: Metadata = {
  title: "Ecodesk - Customer Ticketing Management System",
  description: "Developed by IT Team and Leroux Y Xchire",
  icons: {
    icon: "/Ecodesk.png",
    shortcut: "/Ecodesk.png",
    apple: "/Ecodesk.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <UserProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Reminders />
            <Suspense fallback={null}>
              <TicketReceived />
            </Suspense>
            {children}
          </ThemeProvider>
          <Toaster />
        </UserProvider>
      </body>
    </html>
  );
}
