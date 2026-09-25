import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOVA IA",
  description: "AI Business Operator — measurable work, controlled autonomy."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
