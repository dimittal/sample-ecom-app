import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
