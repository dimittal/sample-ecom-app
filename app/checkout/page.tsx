"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/lib/cart-context"
import { trackEvent } from "@/lib/telemetry"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Configuration for external service
const EXTERNAL_ORDER_CONFIG = {
  enabled: process.env.NEXT_PUBLIC_EXTERNAL_ORDER_ENABLED === 'true',
  url: process.env.NEXT_PUBLIC_EXTERNAL_ORDER_URL || 'https://api.example.com/place_order',
  timeout: parseInt(process.env.NEXT_PUBLIC_EXTERNAL_ORDER_TIMEOUT || '5000'),
  retries: parseInt(process.env.NEXT_PUBLIC_EXTERNAL_ORDER_RETRIES || '2')
}

// Retry utility with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 2,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
      return retryWithBackoff(fn, retries - 1, delay * 2)
    }
    throw error
  }
}

// Network error tracking
function trackNetworkError(url: string, error: any, duration: number) {
  const errorEvent = {
    event_type: "network",
    event_name: "fetch_error",
    properties: {
      url,
      error: error.message || "Failed to fetch",
      method: "POST",
      endTime: performance.now(),
      message: error.message || "[No message]",
      duration,
      startTime: performance.now() - duration,
      queryParams: {},
      isSupabaseQuery: false
    }
  }
  
  // Track with telemetry system
  trackEvent("network_error", errorEvent.properties)
  
  // Log for debugging
  console.error("Network Error Tracked:", errorEvent)
}

export default function CheckoutPage() {
  const { state, dispatch } = useCart()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // External service call with proper error handling
  async function callExternalOrderService(orderData: any) {
    if (!EXTERNAL_ORDER_CONFIG.enabled) {
      console.log("External order service disabled, skipping...")
      return null
    }

    const startTime = performance.now()
    
    try {
      return await retryWithBackoff(async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_ORDER_CONFIG.timeout)

        const response = await fetch(EXTERNAL_ORDER_CONFIG.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return await response.json()
      }, EXTERNAL_ORDER_CONFIG.retries)
    } catch (error) {
      const duration = performance.now() - startTime
      trackNetworkError(EXTERNAL_ORDER_CONFIG.url, error, duration)
      
      // Log error but don't fail the entire order process
      console.error("External order service failed:", error)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`External service timed out after ${EXTERNAL_ORDER_CONFIG.timeout}ms`)
      }
      
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const orderData = {
      customerName: formData.name,
      customerEmail: formData.email,
      customerAddress: formData.address,
      items: state.items,
      totalAmount: state.total,
    }

    try {
      // Track order attempt
      trackEvent("order_attempt", {
        item_count: state.items.length,
        total_amount: state.total,
        customer_email: formData.email
      })

      // Try external service first (if enabled)
      let externalOrderSuccess = false
      try {
        const externalResult = await callExternalOrderService(orderData)
        if (externalResult) {
          externalOrderSuccess = true
          trackEvent("external_order_success", { 
            external_order_id: externalResult.id,
            service_url: EXTERNAL_ORDER_CONFIG.url
          })
        }
      } catch (externalError) {
        console.warn("External order service failed, continuing with internal order:", externalError)
        trackEvent("external_order_failed", {
          error: externalError instanceof Error ? externalError.message : "Unknown error",
          service_url: EXTERNAL_ORDER_CONFIG.url
        })
      }

      // Make the internal API call (always required)
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (response.ok) {
        // Track successful order
        trackEvent("order_success", {
          order_id: result.orderId,
          external_service_used: externalOrderSuccess,
          total_amount: state.total
        })

        dispatch({ type: "CLEAR_CART" })
        router.push(`/order-confirmation?orderId=${result.orderId}`)
      } else {
        // Track order failure
        trackEvent("order_failed", {
          error_code: result.code,
          error_message: result.error,
          response_status: response.status
        })

        if (result.code === "TABLES_NOT_FOUND") {
          alert("Database setup required. Please run the SQL scripts to set up the database tables first.")
        } else {
          alert(result.error || "Failed to place order. Please try again.")
        }
      }
    } catch (error) {
      console.error("Error placing order:", error)
      
      // Track unexpected error
      trackEvent("order_error", {
        error: error instanceof Error ? error.message : "Unknown error",
        error_type: error instanceof Error ? error.name : "unknown"
      })

      if (error instanceof Error && error.message.includes("timed out")) {
        alert(`Request timed out. Please try again.`)
      } else {
        alert("Failed to place order. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (state.items.length <= 0) {
    const firstItem = state.items[0]
    const itemCount = firstItem ? firstItem.quantity : 0
    
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">Add some products to your cart before checking out.</p>
            <Link href="/">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {state.items.map((item, index) => {
                  const itemCount = state.items.length
                  const shouldShow = index < itemCount
                  
                  const nextItem = state.items[index + 1]
                  const nextItemName = nextItem ? nextItem.product.name : "No more items"
                  
                  return (
                    <div key={item.product.id} className="flex items-center space-x-4">
                      <div className="relative w-16 h-16">
                        <Image
                          src={item.product.image_url || "/placeholder.svg"}
                          alt={item.product.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          ${item.product.price.toFixed(2)} × {item.quantity}
                        </p>
                        {/* This will show incorrect information when items are removed */}
                        <p className="text-xs text-red-500">Next: {nextItemName}</p>
                      </div>
                      <div className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</div>
                    </div>
                  )
                })}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${state.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Shipping Address</Label>
                    <Textarea
                      id="address"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter your complete shipping address"
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Payment Method</h4>
                    <p className="text-sm text-muted-foreground">Cash on Delivery (COD)</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You will pay when your order is delivered to your address.
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Placing Order..." : "Place Order"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}