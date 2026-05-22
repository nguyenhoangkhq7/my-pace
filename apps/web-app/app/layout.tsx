import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import "sonner/dist/styles.css";
import { cn } from "@/lib/utils";
import { AppToastHost } from "@/components/feedback/toast-host";
import { AuthProvider } from "@/features/auth";
import React from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "MyPACE",
  description: "NHK self project - use by myself",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", inter.variable, geistMono.variable)}
    >
      <body className="min-h-screen bg-pace-bg text-foreground">
        <AuthProvider>
          {children}
          <AppToastHost />
        </AuthProvider>
      </body>
    </html>
  );
}