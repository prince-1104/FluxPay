import type { Metadata } from "next";
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
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
        <ClerkProvider>
          <header className="flex items-center justify-end gap-3 border-b border-white/10 bg-surface px-4 py-3">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="rounded-md px-4 py-2 text-sm text-neutral-300 hover:text-white">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
                  Sign up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9",
                  },
                }}
              />
            </Show>
          </header>
          <Providers>
            {children}
            <Toaster theme="dark" closeButton richColors />
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
