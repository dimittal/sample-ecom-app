import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example"

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn("⚠️  Supabase environment variables not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.")
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Product = {
  id: number
  name: string
  description: string
  price: number
  image_url: string
  stock_quantity: number
  created_at: string
}

export type Order = {
  id: number
  customer_name: string
  customer_email: string
  customer_address: string
  total_amount: number
  status: string
  created_at: string
}

export type OrderItem = {
  id: number
  order_id: number
  product_id: number
  quantity: number
  price: number
  created_at: string
}
