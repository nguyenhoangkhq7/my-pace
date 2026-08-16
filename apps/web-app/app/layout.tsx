import type { Metadata } from "next";
import "./globals.css";
import "sonner/dist/styles.css";
import { AppToastHost } from "@/components/feedback/toast-host";
import { AuthProvider } from "@/features/auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import React from "react";

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
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
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