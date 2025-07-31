// Alternative implementation if the main one doesn't work
let telemetryInitialized = false

export const initTelemetryAlternative = () => {
  try {
    if (typeof window !== "undefined" && !telemetryInitialized) {
      // Simple fetch-based tracking as fallback
      const apiKey = "sk_Ld-IpaNxIBVeMlFVMkB7t-Ray1BCEXdtJ4_fwQF3qZg"

      // Store config globally for tracking functions
      ;(window as any).__hyperlook_config = {
        apiKey,
        environment: process.env.NODE_ENV || "development",
      }

      telemetryInitialized = true
      console.log("Hyperlook Telemetry (alternative) initialized successfully")
    }
  } catch (error) {
    console.error("Failed to initialize alternative telemetry:", error)
  }
}

export const trackEventAlternative = async (eventName: string, properties?: Record<string, any>) => {
  try {
    if (typeof window !== "undefined" && (window as any).__hyperlook_config) {
      const config = (window as any).__hyperlook_config

      // Send event via fetch API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      try {
        await fetch("https://api.hyperlook.com/v1/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            event: eventName,
            properties: {
              ...properties,
              environment: config.environment,
              url: window.location.href,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
            },
          }),
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timeoutId)
      }
    }
  } catch (error) {
    console.error("Failed to track event (alternative):", error)
  }
}

export const trackPageViewAlternative = async (pageName: string, properties?: Record<string, any>) => {
  try {
    if (typeof window !== "undefined" && (window as any).__hyperlook_config) {
      const config = (window as any).__hyperlook_config

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      try {
        await fetch("https://api.hyperlook.com/v1/page", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            page: pageName,
            properties: {
              ...properties,
              environment: config.environment,
              url: window.location.href,
              referrer: document.referrer,
              timestamp: new Date().toISOString(),
            },
          }),
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timeoutId)
      }
    }
  } catch (error) {
    console.error("Failed to track page view (alternative):", error)
  }
}
