"use client"

import type React from "react"

import { createContext, useContext, useReducer, type ReactNode } from "react"
import type { Product } from "./supabase"

type CartItem = {
  product: Product
  quantity: number
}

type CartState = {
  items: CartItem[]
  total: number
}

type CartAction =
  | { type: "ADD_ITEM"; product: Product }
  | { type: "REMOVE_ITEM"; productId: number }
  | { type: "UPDATE_QUANTITY"; productId: number; quantity: number }
  | { type: "CLEAR_CART" }

const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
} | null>(null)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.items.find((item) => item.product.id === action.product.id)

      if (existingItem) {
        // Check if adding one more would exceed stock
        if (existingItem.quantity >= action.product.stock_quantity) {
          console.warn("Cannot add more items: Stock limit reached", {
            productId: action.product.id,
            productName: action.product.name,
            currentQuantity: existingItem.quantity,
            stockAvailable: action.product.stock_quantity
          })
          // Return current state without changes
          return state
        }
        
        const updatedItems = state.items.map((item) =>
          item.product.id === action.product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
        return {
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
        }
      } else {
        // Check if product is in stock before adding
        if (action.product.stock_quantity <= 0) {
          console.warn("Cannot add item: Product is out of stock", {
            productId: action.product.id,
            productName: action.product.name,
            stockAvailable: action.product.stock_quantity
          })
          return state
        }

        const updatedItems = [...state.items, { product: action.product, quantity: 1 }]
        return {
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
        }
      }
    }

    case "REMOVE_ITEM": {
      const updatedItems = state.items.filter((item) => item.product.id !== action.productId)
      return {
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      }
    }

    case "UPDATE_QUANTITY": {
      if (action.quantity <= 0) {
        const updatedItems = state.items.filter((item) => item.product.id !== action.productId)
        return {
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
        }
      }

      // Validate quantity against stock
      const updatedItems = state.items.map((item) => {
        if (item.product.id === action.productId) {
          const newQuantity = Math.min(action.quantity, item.product.stock_quantity)
          if (newQuantity !== action.quantity) {
            console.warn("Quantity adjusted to available stock", {
              productId: action.productId,
              requestedQuantity: action.quantity,
              adjustedQuantity: newQuantity
            })
          }
          return { ...item, quantity: newQuantity }
        }
        return item
      })

      return {
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      }
    }

    case "CLEAR_CART":
      return { items: [], total: 0 }

    default:
      return state
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 })

  return <CartContext.Provider value={{ state, dispatch }}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}