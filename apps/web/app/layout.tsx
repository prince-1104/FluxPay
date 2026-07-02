import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@fontsource/geist";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "sonner";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#080810",
};

export const metadata: Metadata = {
  title: "Settl — Smart Group Expense Splitting for Trips & Teams",
  description:
    "Split trip expenses fairly, settle up instantly, and manage group budgets with Settl — the premium SaaS for travelers and friend groups.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
            <Toaster
              theme="dark"
              closeButton
              richColors
              position="bottom-center"
              toastOptions={{ className: "mb-[10.5rem] lg:mb-4 max-w-[calc(100vw-2rem)]" }}
            />
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
