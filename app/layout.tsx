import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { WalletProvider } from "@/hooks/useWallet";

export const metadata: Metadata = {
  title: "ShadowRaise",
  description: "Confidential AI investment intelligence for founders and investors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface font-sans antialiased">
        <WalletProvider>
          <Navbar />
          <main>{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
