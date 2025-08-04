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
        // Prevent adding if it would exceed the maximum limit of 3
        if (existingItem.quantity >= 3) {
          console.error("WARNING: Item quantity limit reached!", {
            productId: action.product.id,
            productName: action.product.name,
            currentQuantity: existingItem.quantity,
            maxAllowed: 3
          })
          
          // Return current state without modification when limit is reached
          return state
        }
        
        const updatedItems = state.items.map((item) =>
          item.product.id === action.product.id 
            ? { ...item, quantity: Math.min(item.quantity + 1, 3) } 
            : item,
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

      // Enforce quantity limit of 3 per item
      if (action.quantity > 3) {
        const item = state.items.find((item) => item.product.id === action.productId)
        if (item) {
          console.error("WARNING: Item quantity limit reached!", {
            productId: action.productId,
            productName: item.product.name,
            requestedQuantity: action.quantity,
            maxAllowed: 3
          })
        }
        
        // Return current state without modification when limit would be exceeded
        return state
      }

      const updatedItems = state.items.map((item) =>
        item.product.id === action.productId 
          ? { ...item, quantity: Math.min(action.quantity, 3) } 
          : item,
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
