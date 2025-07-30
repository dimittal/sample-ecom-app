"use client"

import { useEffect, type ReactNode } from "react"
import { trackPageView } from "@/lib/telemetry"
import { usePathname } from "next/navigation"
import { initTelemetry } from "@hyperlook/telemetry-sdk";

interface TelemetryProviderProps {
  children: ReactNode
}

export function TelemetryProvider({ children }: TelemetryProviderProps) {
  const pathname = usePathname()

  useEffect(() => {
    const telemetry = initTelemetry({
      hyperlookApiKey: "sk_Ld-IpaNxIBVeMlFVMkB7t-Ray1BCEXdtJ4_fwQF3qZg", // Replace with your actual API key
    });

    return () => {
      telemetry.destroy();
    };
  }, []);

  useEffect(() => {
    // Track page views on route changes (client-side only)
    if (pathname && typeof window !== "undefined") {
      // Add a small delay to ensure telemetry is initialized
      setTimeout(() => {
        trackPageView(pathname, {
          path: pathname,
          timestamp: new Date().toISOString(),
        })
      }, 100)
    }
  }, [pathname])

  return <>{children}</>
}
