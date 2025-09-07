import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "../globals.css";
import { MainLayout } from "@/components/layout/main-layout";
import { Toaster } from "@/components/ui/sonner"
import { UserProvider } from "@/contexts/user-context";
import { getUserFromToken } from "../../../lib/auth";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AWG Stock Manager",
  description: "Sistema de gerenciamento de estoque agrícola",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserFromToken();

  return (
    <html lang="pt-BR">
      <body className={`${nunito.className} antialiased`}>
        <UserProvider user={user}>
          <MainLayout>
            {children}
            <Toaster />
          </MainLayout>
        </UserProvider>
      </body>
    </html>
  );
}
