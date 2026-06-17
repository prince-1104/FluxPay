import type { Metadata } from "next";
import "@fontsource/geist";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Settl - Premium Group Expense Splitting",
  description: "SaaS group trip expense splitting app with a premium dark interface.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster theme="dark" closeButton richColors />
        </Providers>
      </body>
    </html>
  );
}
