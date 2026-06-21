"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export function useRequireAuth() {
  const router = useRouter();
  const { user, isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isInitialized && !user) {
      router.replace("/login");
    }
  }, [isInitialized, user, router]);

  return { user, isInitialized };
}

export function useRedirectIfAuth() {
  const router = useRouter();
  const { user, isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isInitialized && user) {
      router.replace("/dashboard");
    }
  }, [isInitialized, user, router]);
}
