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

const MAX_QUANTITY_PER_ITEM = 3

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.items.find((item) => item.product.id === action.product.id)

      if (existingItem) {
        if (existingItem.quantity >= MAX_QUANTITY_PER_ITEM) {
          // Don't add more items if we've reached the limit
          console.log(`Maximum quantity of ${MAX_QUANTITY_PER_ITEM} reached for ${action.product.name}`)
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

      // Enforce maximum quantity limit
      const limitedQuantity = Math.min(action.quantity, MAX_QUANTITY_PER_ITEM)
      
      const updatedItems = state.items.map((item) =>
        item.product.id === action.productId ? { ...item, quantity: limitedQuantity } : item,
      )
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