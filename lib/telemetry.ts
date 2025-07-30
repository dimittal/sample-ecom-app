import telemetrySDK from "@hyperlook/telemetry-sdk"

// Initialize Hyperlook Telemetry with your API key
const telemetryConfig = {
  apiKey: "sk_Ld-IpaNxIBVeMlFVMkB7t-Ray1BCEXdtJ4_fwQF3qZg",
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
    if (typeof window !== "undefined") {
      telemetry = telemetrySDK.init ? telemetrySDK.init(telemetryConfig) : telemetrySDK(telemetryConfig)
      console.log("Hyperlook Telemetry initialized successfully")
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
