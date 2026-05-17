import React from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
        <section className="w-full max-w-xl">
          {children}
        </section>
      </div>
  );
}

