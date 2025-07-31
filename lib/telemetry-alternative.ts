// Alternative implementation if the main one doesn't work
let telemetryInitialized = false

// Retry utility for telemetry API calls
async function retryTelemetryCall<T>(
  fn: () => Promise<T>,
  retries: number = 2,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0) {
      console.warn(`Telemetry call failed, retrying in ${delay}ms...`, error)
      await new Promise(resolve => setTimeout(resolve, delay))
      return retryTelemetryCall(fn, retries - 1, delay * 2)
    }
    throw error
  }
}

export const initTelemetryAlternative = () => {
  try {
    if (typeof window !== "undefined" && !telemetryInitialized) {
      // Simple fetch-based tracking as fallback
      const apiKey = "sk_Ld-IpaNxIBVeMlFVMkB7t-Ray1BCEXdtJ4_fwQF3qZg"

      // Store config globally for tracking functions
      ;(window as any).__hyperlook_config = {
        apiKey,
        environment: process.env.NODE_ENV || "development",
        maxRetries: 2,
        timeout: 10000
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

      await retryTelemetryCall(async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), config.timeout)

        const response = await fetch("https://api.hyperlook.com/v1/track", {
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
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Telemetry API error: ${response.status} ${response.statusText}`)
        }

        return await response.json()
      }, config.maxRetries)
    }
  } catch (error) {
    console.error("Failed to track event (alternative):", error)
    
    // Store failed events for later retry if needed
    if (typeof window !== "undefined") {
      const failedEvents = JSON.parse(localStorage.getItem('failed_telemetry_events') || '[]')
      failedEvents.push({
        type: 'event',
        name: eventName,
        properties,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      // Keep only last 10 failed events
      localStorage.setItem('failed_telemetry_events', JSON.stringify(failedEvents.slice(-10)))
    }
  }
}

export const trackPageViewAlternative = async (pageName: string, properties?: Record<string, any>) => {
  try {
    if (typeof window !== "undefined" && (window as any).__hyperlook_config) {
      const config = (window as any).__hyperlook_config

      await retryTelemetryCall(async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), config.timeout)

        const response = await fetch("https://api.hyperlook.com/v1/page", {
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
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Telemetry API error: ${response.status} ${response.statusText}`)
        }

        return await response.json()
      }, config.maxRetries)
    }
  } catch (error) {
    console.error("Failed to track page view (alternative):", error)
    
    // Store failed events for later retry if needed
    if (typeof window !== "undefined") {
      const failedEvents = JSON.parse(localStorage.getItem('failed_telemetry_events') || '[]')
      failedEvents.push({
        type: 'page',
        name: pageName,
        properties,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      // Keep only last 10 failed events
      localStorage.setItem('failed_telemetry_events', JSON.stringify(failedEvents.slice(-10)))
    }
  }
}

// Function to retry failed events
export const retryFailedTelemetryEvents = async () => {
  if (typeof window === "undefined") return

  try {
    const failedEvents = JSON.parse(localStorage.getItem('failed_telemetry_events') || '[]')
    
    if (failedEvents.length === 0) return

    console.log(`Retrying ${failedEvents.length} failed telemetry events...`)

    const successfulEvents = []
    
    for (const event of failedEvents) {
      try {
        if (event.type === 'event') {
          await trackEventAlternative(event.name, event.properties)
        } else if (event.type === 'page') {
          await trackPageViewAlternative(event.name, event.properties)
        }
        successfulEvents.push(event)
      } catch (retryError) {
        console.warn(`Failed to retry event ${event.name}:`, retryError)
      }
    }

    // Remove successfully retried events
    const remainingEvents = failedEvents.filter(e => !successfulEvents.includes(e))
    localStorage.setItem('failed_telemetry_events', JSON.stringify(remainingEvents))

    if (successfulEvents.length > 0) {
      console.log(`Successfully retried ${successfulEvents.length} telemetry events`)
    }
  } catch (error) {
    console.error("Failed to retry telemetry events:", error)
  }
}