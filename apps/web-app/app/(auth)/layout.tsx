import React from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-12">
      <section className="w-full max-w-md">{children}</section>
    </div>
  );
}

