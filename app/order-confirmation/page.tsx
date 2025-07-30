import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

async function getOrder(orderId: string) {
  const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).single()

  if (orderError) {
    console.error("Error fetching order:", orderError)
    return null
  }

  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select(`
      *,
      products (
        name,
        image_url
      )
    `)
    .eq("order_id", orderId)

  if (itemsError) {
    console.error("Error fetching order items:", itemsError)
    return { ...order, items: [] }
  }

  return { ...order, items: orderItems || [] }
}

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: { orderId?: string }
}) {
  const orderId = searchParams.orderId

  if (!orderId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Invalid order ID</p>
            <Link href="/" className="mt-4 inline-block">
              <Button>Return to Store</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const order = await getOrder(orderId)

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Order not found</p>
            <Link href="/" className="mt-4 inline-block">
              <Button>Return to Store</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
              <p className="text-muted-foreground">
                Thank you for your order. We'll send you a confirmation email shortly.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Order Details</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Order ID:</span> #{order.id}
                  </p>
                  <p>
                    <span className="font-medium">Date:</span> {new Date(order.created_at).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium">Total:</span> ${order.total_amount.toFixed(2)}
                  </p>
                  <p>
                    <span className="font-medium">Payment:</span> Cash on Delivery
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Shipping Information</h3>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Name:</span> {order.customer_name}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {order.customer_email}
                  </p>
                  <p>
                    <span className="font-medium">Address:</span>
                  </p>
                  <p className="pl-4 text-muted-foreground">{order.customer_address}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Items Ordered</h3>
                <div className="space-y-2">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span>
                        {item.products.name} × {item.quantity}
                      </span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center pt-4">
                <Link href="/">
                  <Button>Continue Shopping</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
