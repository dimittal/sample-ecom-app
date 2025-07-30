import { supabase, type Product } from "@/lib/supabase"
import { ProductCard } from "@/components/product-card"
import { CartSidebar } from "@/components/cart-sidebar"

// Mock data fallback when database tables don't exist
function getMockProducts(): Product[] {
  return [
    {
      id: 1,
      name: "Wireless Headphones",
      description: "High-quality wireless headphones with noise cancellation",
      price: 99.99,
      image_url: "/placeholder.svg?height=300&width=300&text=Wireless+Headphones",
      stock_quantity: 25,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: "Smartphone Case",
      description: "Durable protective case for smartphones",
      price: 19.99,
      image_url: "/placeholder.svg?height=300&width=300&text=Smartphone+Case",
      stock_quantity: 50,
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      name: "Bluetooth Speaker",
      description: "Portable Bluetooth speaker with excellent sound quality",
      price: 79.99,
      image_url: "/placeholder.svg?height=300&width=300&text=Bluetooth+Speaker",
      stock_quantity: 30,
      created_at: new Date().toISOString(),
    },
    {
      id: 4,
      name: "Laptop Stand",
      description: "Adjustable aluminum laptop stand for better ergonomics",
      price: 49.99,
      image_url: "/placeholder.svg?height=300&width=300&text=Laptop+Stand",
      stock_quantity: 20,
      created_at: new Date().toISOString(),
    },
    {
      id: 5,
      name: "USB-C Cable",
      description: "Fast charging USB-C cable 6ft length",
      price: 14.99,
      image_url: "/placeholder.svg?height=300&width=300&text=USB-C+Cable",
      stock_quantity: 100,
      created_at: new Date().toISOString(),
    },
    {
      id: 6,
      name: "Wireless Mouse",
      description: "Ergonomic wireless mouse with precision tracking",
      price: 34.99,
      image_url: "/placeholder.svg?height=300&width=300&text=Wireless+Mouse",
      stock_quantity: 40,
      created_at: new Date().toISOString(),
    },
    {
      id: 7,
      name: "Phone Charger",
      description: "Fast wireless charging pad for smartphones",
      price: 29.99,
      image_url: "/placeholder.svg?height=300&width=300&text=Phone+Charger",
      stock_quantity: 35,
      created_at: new Date().toISOString(),
    },
    {
      id: 8,
      name: "Tablet Holder",
      description: "Adjustable tablet holder for desk or bedside use",
      price: 24.99,
      image_url: "/placeholder.svg?height=300&width=300&text=Tablet+Holder",
      stock_quantity: 15,
      created_at: new Date().toISOString(),
    },
    {
      id: 9,
      name: "Keyboard Cover",
      description: "Silicone keyboard cover for laptop protection",
      price: 12.99,
      image_url: "/placeholder.svg?height=300&width=300&text=Keyboard+Cover",
      stock_quantity: 60,
      created_at: new Date().toISOString(),
    },
    {
      id: 10,
      name: "Screen Cleaner",
      description: "Professional screen cleaning kit for all devices",
      price: 9.99,
      image_url: "/placeholder.svg?height=300&width=300&text=Screen+Cleaner",
      stock_quantity: 80,
      created_at: new Date().toISOString(),
    },
  ]
}

async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching products:", error)

      // If tables don't exist, return mock data
      if (error.code === "42P01") {
        console.log("Products table doesn't exist yet. Using mock data.")
        return getMockProducts()
      }

      return []
    }

    return data || []
  } catch (error) {
    console.error("Database connection error:", error)
    return getMockProducts()
  }
}

export default async function Home() {
  const products = await getProducts()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">TechStore</h1>
          <CartSidebar />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Our Products</h2>
          <p className="text-muted-foreground">Discover our amazing collection of tech accessories</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products available at the moment.</p>
          </div>
        )}
      </main>
    </div>
  )
}
