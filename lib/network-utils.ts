import { trackEvent } from './telemetry'

// Network error types
export enum NetworkErrorType {
  TIMEOUT = 'timeout',
  NETWORK_ERROR = 'network_error',
  HTTP_ERROR = 'http_error',
  ABORT_ERROR = 'abort_error',
  PARSE_ERROR = 'parse_error'
}

// Enhanced network error class
export class NetworkError extends Error {
  public readonly type: NetworkErrorType
  public readonly statusCode?: number
  public readonly url: string
  public readonly duration: number

  constructor(
    message: string,
    type: NetworkErrorType,
    url: string,
    duration: number,
    statusCode?: number
  ) {
    super(message)
    this.name = 'NetworkError'
    this.type = type
    this.url = url
    this.duration = duration
    this.statusCode = statusCode
  }
}

// Circuit breaker for external services
class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private readonly failureThreshold = 5,
    private readonly recoveryTimeout = 30000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable')
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open'
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    }
  }
}

// Global circuit breaker for external services
const externalServiceCircuitBreaker = new CircuitBreaker()

// Retry utility with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        break
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// Enhanced fetch with telemetry, timeouts, and error handling
export async function enhancedFetch(
  url: string,
  options: RequestInit & {
    timeout?: number
    retries?: number
    trackErrors?: boolean
    useCircuitBreaker?: boolean
  } = {}
): Promise<Response> {
  const {
    timeout = 10000,
    retries = 2,
    trackErrors = true,
    useCircuitBreaker = false,
    ...fetchOptions
  } = options

  const startTime = performance.now()

  const makeRequest = async (): Promise<Response> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const duration = performance.now() - startTime
        const error = new NetworkError(
          `HTTP ${response.status}: ${response.statusText}`,
          NetworkErrorType.HTTP_ERROR,
          url,
          duration,
          response.status
        )
        
        if (trackErrors) {
          trackNetworkError(url, error, duration, fetchOptions.method as string || 'GET')
        }
        
        throw error
      }

      return response
    } catch (error) {
      clearTimeout(timeoutId)
      const duration = performance.now() - startTime

      let networkError: NetworkError

      if (error instanceof NetworkError) {
        networkError = error
      } else if (error instanceof Error && error.name === 'AbortError') {
        networkError = new NetworkError(
          `Request timed out after ${timeout}ms`,
          NetworkErrorType.TIMEOUT,
          url,
          duration
        )
      } else {
        networkError = new NetworkError(
          error instanceof Error ? error.message : 'Network request failed',
          NetworkErrorType.NETWORK_ERROR,
          url,
          duration
        )
      }

      if (trackErrors) {
        trackNetworkError(url, networkError, duration, fetchOptions.method as string || 'GET')
      }

      throw networkError
    }
  }

  const executeRequest = useCircuitBreaker
    ? () => externalServiceCircuitBreaker.execute(makeRequest)
    : makeRequest

  if (retries > 0) {
    return await retryWithBackoff(executeRequest, retries)
  } else {
    return await executeRequest()
  }
}

// Telemetry tracking for network errors
function trackNetworkError(
  url: string,
  error: NetworkError,
  duration: number,
  method: string
) {
  const errorEvent = {
    event_type: "network",
    event_name: "fetch_error",
    properties: {
      url,
      error: error.message,
      error_type: error.type,
      method: method.toUpperCase(),
      endTime: performance.now(),
      message: error.message,
      duration,
      startTime: performance.now() - duration,
      queryParams: {},
      isSupabaseQuery: url.includes('supabase'),
      status_code: error.statusCode,
      circuit_breaker_state: externalServiceCircuitBreaker.getState()
    }
  }
  
  // Track with telemetry system
  trackEvent("network_error", errorEvent.properties)
  
  // Log for debugging
  console.error("Network Error Tracked:", errorEvent)
}

// Convenience method for JSON requests
export async function fetchJSON<T = any>(
  url: string,
  options: Parameters<typeof enhancedFetch>[1] = {}
): Promise<T> {
  const response = await enhancedFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  try {
    return await response.json()
  } catch (error) {
    const duration = performance.now() - (response as any).startTime || 0
    throw new NetworkError(
      'Failed to parse JSON response',
      NetworkErrorType.PARSE_ERROR,
      url,
      duration
    )
  }
}

// Get circuit breaker status
export function getCircuitBreakerStatus() {
  return externalServiceCircuitBreaker.getState()
}