import telemetrySDK from "@hyperlook/telemetry-sdk"

// Initialize Hyperlook Telemetry with your API key from environment variables
const telemetryConfig = {
  apiKey: process.env.NEXT_PUBLIC_HYPERLOOK_API_KEY || "",
  environment: process.env.NODE_ENV || "development",
  // Optional: Configure additional settings
  enableAutoTracking: true,
  enableErrorTracking: true,
  enablePerformanceTracking: true,
}

let telemetry: any = null

// Initialize the SDK
export const initTelemetry = () => {
  try {
    if (typeof window !== "undefined" && telemetryConfig.apiKey) {
      telemetry = telemetrySDK.init ? telemetrySDK.init(telemetryConfig) : telemetrySDK(telemetryConfig)
      console.log("Hyperlook Telemetry initialized successfully")
    } else if (!telemetryConfig.apiKey) {
      console.warn("Hyperlook Telemetry API key not found. Set NEXT_PUBLIC_HYPERLOOK_API_KEY environment variable.")
    }
  } catch (error) {
    console.error("Failed to initialize Hyperlook Telemetry:", error)
  }
}

// Custom event tracking functions
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  try {
    if (telemetry && typeof window !== "undefined") {
      if (telemetry.track) {
        telemetry.track(eventName, properties)
      } else if (telemetrySDK.track) {
        telemetrySDK.track(eventName, properties)
      }
    }
  } catch (error) {
    console.error("Failed to track event:", error)
  }
}

export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  try {
    if (telemetry && typeof window !== "undefined") {
      if (telemetry.page) {
        telemetry.page(pageName, properties)
      } else if (telemetrySDK.page) {
        telemetrySDK.page(pageName, properties)
      }
    }
  } catch (error) {
    console.error("Failed to track page view:", error)
  }
}

export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  try {
    if (telemetry && typeof window !== "undefined") {
      if (telemetry.identify) {
        telemetry.identify(userId, traits)
      } else if (telemetrySDK.identify) {
        telemetrySDK.identify(userId, traits)
      }
    }
  } catch (error) {
    console.error("Failed to identify user:", error)
  }
}