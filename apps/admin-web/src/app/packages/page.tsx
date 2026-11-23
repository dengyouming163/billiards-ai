"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function PackagesPage() {
  const { permissionCodes, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (permissionCodes.length > 0 && !permissionCodes.includes("settings:product")) {
      router.replace("/");
    } else {
      router.replace("/pricing");
    }
  }, [isLoading, permissionCodes, router]);

  return null;
}
