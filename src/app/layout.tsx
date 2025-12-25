import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bingo de Natal 2025",
  description: "Jogo de bingo para família no Natal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
