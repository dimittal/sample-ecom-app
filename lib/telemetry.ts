// Fallback to alternative telemetry implementation due to SDK issues
import { initTelemetryAlternative, trackEventAlternative, trackPageViewAlternative } from "./telemetry-alternative"

// Initialize the SDK
export const initTelemetry = () => {
  try {
    if (typeof window !== "undefined") {
      initTelemetryAlternative()
      console.log("Hyperlook Telemetry (fallback) initialized successfully")
    }
  } catch (error) {
    console.error("Failed to initialize Hyperlook Telemetry:", error)
  }
}

// Custom event tracking functions
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  try {
    if (typeof window !== "undefined") {
      trackEventAlternative(eventName, properties)
    }
  } catch (error) {
    console.error("Failed to track event:", error)
  }
}

export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  try {
    if (typeof window !== "undefined") {
      trackPageViewAlternative(pageName, properties)
    }
  } catch (error) {
    console.error("Failed to track page view:", error)
  }
}

export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  try {
    if (typeof window !== "undefined") {
      console.log("User identified:", userId, traits)
    }
  } catch (error) {
    console.error("Failed to identify user:", error)
  }
}
