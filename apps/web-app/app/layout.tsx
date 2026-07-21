import type {Metadata} from "next";
import {Geist_Mono, Inter} from "next/font/google";
import "./globals.css";
import "sonner/dist/styles.css";
import {cn} from "@/lib/utils";
import {AppToastHost} from "@/components/feedback/toast-host";
import {AuthProvider} from "@/features/auth";
import {TooltipProvider} from "@/components/ui/tooltip";
import {ReactQueryProvider} from "@/components/providers/react-query-provider";
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
  description: "Master your daily schedule with MyPACE. Combine timeboxing, calendar integration, and smart daily planning to eliminate distractions and boost your focus.",
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.classList.remove('dark', 'light', 'graphite', 'nord', 'sage', 'rose');
                  document.documentElement.classList.add(theme);
                  var dark = ['dark', 'graphite', 'nord', 'rose'];
                  document.documentElement.style.colorScheme = dark.includes(theme) ? 'dark' : 'light';
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <ReactQueryProvider>
          <AuthProvider>
            <TooltipProvider>
              {children}
              <AppToastHost />
            </TooltipProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}