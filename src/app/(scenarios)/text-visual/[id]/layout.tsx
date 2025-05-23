import React from "react";

export default async function TextVisualLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  // Await the params before using them if needed
  await params;

  return <>{children}</>;
}
