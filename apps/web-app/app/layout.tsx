import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
          className={cn(
              "h-full antialiased",
              geistSans.variable,
              geistMono.variable,
              "font-sans",
              inter.variable
          )}
      >
        <body className="flex min-h-screen bg-pace-bg text-foreground">
        <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopHeader />
            <main className="flex min-h-0 flex-1 flex-col px-8 pb-10">
              {children}
            </main>
          </div>
        </body>
      </html>
  );
}