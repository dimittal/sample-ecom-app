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
  lastError: string | null
}

type CartAction =
  | { type: "ADD_ITEM"; product: Product }
  | { type: "REMOVE_ITEM"; productId: number }
  | { type: "UPDATE_QUANTITY"; productId: number; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "CLEAR_ERROR" }

const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
} | null>(null)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.items.find((item) => item.product.id === action.product.id)

      if (existingItem) {
        if (existingItem.quantity >= 3) {
          // Return state with error message when limit is reached
          return {
            ...state,
            lastError: `Maximum quantity of 3 reached for ${action.product.name}`
          }
        }
        
        const updatedItems = state.items.map((item) =>
          item.product.id === action.product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
        return {
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
          lastError: null,
        }
      } else {
        const updatedItems = [...state.items, { product: action.product, quantity: 1 }]
        return {
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
          lastError: null,
        }
      }
    }

    case "REMOVE_ITEM": {
      const updatedItems = state.items.filter((item) => item.product.id !== action.productId)
      return {
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
        lastError: null,
      }
    }

    case "UPDATE_QUANTITY": {
      if (action.quantity <= 0) {
        const updatedItems = state.items.filter((item) => item.product.id !== action.productId)
        return {
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
          lastError: null,
        }
      }

      // Enforce quantity limit of 3 per item
      if (action.quantity > 3) {
        const item = state.items.find((item) => item.product.id === action.productId)
        const productName = item ? item.product.name : 'Item'
        
        // Return state with error message when limit would be exceeded
        return {
          ...state,
          lastError: `Maximum quantity of 3 reached for ${productName}`
        }
      }

      const updatedItems = state.items.map((item) =>
        item.product.id === action.productId ? { ...item, quantity: action.quantity } : item,
      )
      return {
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
        lastError: null,
      }
    }

    case "CLEAR_CART":
      return { items: [], total: 0, lastError: null }

    case "CLEAR_ERROR":
      return { ...state, lastError: null }

    default:
      return state
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0, lastError: null })

  return <CartContext.Provider value={{ state, dispatch }}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
