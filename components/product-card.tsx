"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Product } from "@/lib/supabase"
import { useCart } from "@/lib/cart-context"
import { useState, useEffect } from "react"
import { CheckCircle, AlertTriangle } from "lucide-react"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { state, dispatch } = useCart()
  const [addedQuantity, setAddedQuantity] = useState(0)
  const [showAdded, setShowAdded] = useState(false)
  const [canAddMore, setCanAddMore] = useState(true)

  useEffect(() => {
    const cartItem = state.items.find((item) => item.product.id === product.id)
    const currentQuantity = cartItem?.quantity || 0
    setAddedQuantity(currentQuantity)
    setCanAddMore(currentQuantity < product.stock_quantity && product.stock_quantity > 0)
  }, [state.items, product.id, product.stock_quantity])

  const handleAddToCart = () => {
    if (!canAddMore) {
      return
    }

    dispatch({ type: "ADD_ITEM", product })

    // Show feedback animation only if successfully added
    const newQuantity = addedQuantity + 1
    if (newQuantity <= product.stock_quantity) {
      setShowAdded(true)
      
      // Hide feedback after 2 seconds
      setTimeout(() => {
        setShowAdded(false)
      }, 2000)
    }
  }

  const isOutOfStock = product.stock_quantity === 0
  const isMaxReached = addedQuantity >= product.stock_quantity
  const buttonDisabled = isOutOfStock || isMaxReached

  const getButtonText = () => {
    if (isOutOfStock) return "Out of Stock"
    if (isMaxReached) return "Max Reached"
    if (showAdded) return (
      <span className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4" />
        Added ({addedQuantity})
      </span>
    )
    return addedQuantity > 0 ? `Add to Cart (${addedQuantity})` : "Add to Cart"
  }

  const getStockDisplay = () => {
    if (isOutOfStock) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <AlertTriangle className="h-3 w-3" />
          <span className="text-sm">Out of stock</span>
        </div>
      )
    }
    
    if (product.stock_quantity <= 5) {
      return (
        <div className="flex items-center gap-1 text-amber-600">
          <AlertTriangle className="h-3 w-3" />
          <span className="text-sm">Only {product.stock_quantity} left</span>
        </div>
      )
    }
    
    return (
      <p className="text-sm text-muted-foreground">
        {product.stock_quantity} in stock
      </p>
    )
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
        {getStockDisplay()}
        {isMaxReached && !isOutOfStock && (
          <p className="text-xs text-amber-600 mt-1">
            Maximum quantity in cart
          </p>
        )}
      </CardContent>
      <CardFooter className="p-4">
        <Button
          onClick={handleAddToCart}
          disabled={buttonDisabled}
          className={`w-full transition-all duration-300 ${
            showAdded ? "bg-green-600 hover:bg-green-700" : ""
          } ${buttonDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          title={isMaxReached ? "Cannot add more - stock limit reached" : 
                 isOutOfStock ? "Product is out of stock" : "Add to cart"}
        >
          {getButtonText()}
        </Button>
      </CardFooter>
    </Card>
  )
}