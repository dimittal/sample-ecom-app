import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerName, customerEmail, customerAddress, items, totalAmount } = body

    // Validate required fields
    if (!customerName || !customerEmail || !customerAddress || !items || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      )
    }

    // Check if database tables exist
    const { data: tableCheck, error: tableError } = await supabase.from("orders").select("id").limit(1)

    if (tableError && tableError.code === "42P01") {
      return NextResponse.json(
        {
          error: "Database tables not set up. Please run the SQL scripts first.",
          code: "TABLES_NOT_FOUND",
        },
        { status: 503 },
      )
    }

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName,
        customer_email: customerEmail,
        customer_address: customerAddress,
        total_amount: totalAmount,
        status: "pending",
      })
      .select()
      .single()

    if (orderError) {
      console.error("Error creating order:", orderError)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    // Create order items and update inventory
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("Error creating order items:", itemsError)
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 })
    }

    // Update inventory for each product
    for (const item of items) {
      const { error: updateError } = await supabase
        .from("products")
        .update({
          stock_quantity: item.product.stock_quantity - item.quantity,
        })
        .eq("id", item.product.id)

      if (updateError) {
        console.error("Error updating inventory:", updateError)
        // Continue with other updates even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: "Order placed successfully",
    })
  } catch (error) {
    console.error("Error processing order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
