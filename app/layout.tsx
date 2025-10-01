// FIX: Import React to resolve namespace error for React.ReactNode.
import React from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bushyfam's Studio Shot",
  description: "Eine Anwendung, die hochgeladene Produktbilder mithilfe der Gemini-API in hochwertige Fotos im Studiostil umwandelt. Sie verbessert die Beleuchtung, entfernt Hintergründe und korrigiert die Farben, um die Bilder für E-Commerce-Kataloge geeignet zu machen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="bg-gray-100 dark:bg-gray-900">{children}</body>
    </html>
  );
}