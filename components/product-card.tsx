"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Product } from "@/lib/supabase"
import { useCart } from "@/lib/cart-context"
import { useState, useEffect } from "react"
import { CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { state, dispatch } = useCart()
  const { toast } = useToast()
  const [addedQuantity, setAddedQuantity] = useState(0)
  const [showAdded, setShowAdded] = useState(false)

  useEffect(() => {
    const cartItem = state.items.find((item) => item.product.id === product.id)
    setAddedQuantity(cartItem?.quantity || 0)
  }, [state.items, product.id])

  // Monitor for cart errors and show toast notifications
  useEffect(() => {
    if (state.lastError) {
      toast({
        title: "Quantity Limit Reached",
        description: state.lastError,
        variant: "destructive",
      })
      // Clear the error after showing it
      dispatch({ type: "CLEAR_ERROR" })
    }
  }, [state.lastError, toast, dispatch])

  const handleAddToCart = () => {
    const cartItem = state.items.find((item) => item.product.id === product.id)
    const currentQuantity = cartItem?.quantity || 0
    
    // Check if we're at the limit before dispatching
    if (currentQuantity < 3) {
      dispatch({ type: "ADD_ITEM", product })
      
      // Show success animation
      setShowAdded(true)
      
      // Hide feedback after 2 seconds
      setTimeout(() => {
        setShowAdded(false)
      }, 2000)
    } else {
      // Still dispatch to trigger the error message
      dispatch({ type: "ADD_ITEM", product })
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4">
        <div className="aspect-square relative mb-4">
          <Image
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover rounded-md"
          />
        </div>
        <CardTitle className="text-lg">{product.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-0">
        <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
        <p className="text-2xl font-bold">${product.price.toFixed(2)}</p>
        <p className="text-sm text-muted-foreground">
          {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
        </p>
      </CardContent>
      <CardFooter className="p-4">
        <Button
          onClick={handleAddToCart}
          disabled={product.stock_quantity === 0}
          className={`w-full transition-all duration-300 ${showAdded ? "bg-green-600 hover:bg-green-700" : ""}`}
        >
          {showAdded ? (
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Added ({addedQuantity})
            </span>
          ) : product.stock_quantity > 0 ? (
            addedQuantity > 0 ? (
              `Add to Cart (${addedQuantity})`
            ) : (
              "Add to Cart"
            )
          ) : (
            "Out of Stock"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
