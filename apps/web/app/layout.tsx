import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@fontsource/geist";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Settl — Smart Group Expense Splitting for Trips & Teams",
  description:
    "Split trip expenses fairly, settle up instantly, and manage group budgets with Settl — the premium SaaS for travelers and friend groups.",
  openGraph: {
    title: "Settl — Group Expense Splitting",
    description: "Fair splits. Smart settlements. Zero awkward money talks.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased mesh-bg">
        <ClerkProvider>
          <Providers>
            {children}
            <Toaster theme="dark" closeButton richColors position="top-right" />
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
