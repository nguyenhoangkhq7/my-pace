import React from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
        <section className="w-full max-w-2xl">
          {children}
        </section>
      </div>
  );
}

