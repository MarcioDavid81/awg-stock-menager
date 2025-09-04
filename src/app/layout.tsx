import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { MainLayout } from "@/components/layout/main-layout";
import { Toaster } from "@/components/ui/sonner"

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AWG Stock Manager",
  description: "Sistema de gerenciamento de estoque agrícola",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${nunito.className} antialiased`}
      >
        <MainLayout>
          {children}
          <Toaster />
        </MainLayout>
      </body>
    </html>
  );
}
