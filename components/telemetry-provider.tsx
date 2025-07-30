"use client"

import { useEffect, type ReactNode } from "react"
import { initTelemetry, trackPageView } from "@/lib/telemetry"
import { usePathname } from "next/navigation"

interface TelemetryProviderProps {
  children: ReactNode
}

export function TelemetryProvider({ children }: TelemetryProviderProps) {
  const pathname = usePathname()

  useEffect(() => {
    // Initialize telemetry on app load (client-side only)
    if (typeof window !== "undefined") {
      initTelemetry()
    }
  }, [])

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
