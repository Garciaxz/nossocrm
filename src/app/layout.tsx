import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM RD Revestimentos",
  description: "Gestão de leads e atendimento",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
