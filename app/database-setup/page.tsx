"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, CheckCircle, Copy } from "lucide-react"
import Link from "next/link"

export default function DatabaseSetupPage() {
  const sqlScript1 = `-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_address TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`

  const sqlScript2 = `-- Insert 10 sample products
INSERT INTO products (name, description, price, image_url, stock_quantity) VALUES
('Wireless Headphones', 'High-quality wireless headphones with noise cancellation', 99.99, '/placeholder.svg?height=300&width=300', 25),
('Smartphone Case', 'Durable protective case for smartphones', 19.99, '/placeholder.svg?height=300&width=300', 50),
('Bluetooth Speaker', 'Portable Bluetooth speaker with excellent sound quality', 79.99, '/placeholder.svg?height=300&width=300', 30),
('Laptop Stand', 'Adjustable aluminum laptop stand for better ergonomics', 49.99, '/placeholder.svg?height=300&width=300', 20),
('USB-C Cable', 'Fast charging USB-C cable 6ft length', 14.99, '/placeholder.svg?height=300&width=300', 100),
('Wireless Mouse', 'Ergonomic wireless mouse with precision tracking', 34.99, '/placeholder.svg?height=300&width=300', 40),
('Phone Charger', 'Fast wireless charging pad for smartphones', 29.99, '/placeholder.svg?height=300&width=300', 35),
('Tablet Holder', 'Adjustable tablet holder for desk or bedside use', 24.99, '/placeholder.svg?height=300&width=300', 15),
('Keyboard Cover', 'Silicone keyboard cover for laptop protection', 12.99, '/placeholder.svg?height=300&width=300', 60),
('Screen Cleaner', 'Professional screen cleaning kit for all devices', 9.99, '/placeholder.svg?height=300&width=300', 80);`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold">
            TechStore
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <Database className="mx-auto h-16 w-16 text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold mb-2">Database Setup Required</h1>
          <p className="text-muted-foreground">
            Follow these steps to set up your Supabase database for the ecommerce application.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  1
                </span>
                Create Database Tables
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Run this SQL script in your Supabase SQL Editor to create the necessary tables:
              </p>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{sqlScript1}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 bg-transparent"
                  onClick={() => copyToClipboard(sqlScript1)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  2
                </span>
                Seed Sample Products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Run this SQL script to add 10 sample products to your store:
              </p>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{sqlScript2}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 bg-transparent"
                  onClick={() => copyToClipboard(sqlScript2)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  <CheckCircle className="h-4 w-4" />
                </span>
                Setup Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to your Supabase project dashboard</li>
                <li>Navigate to the SQL Editor</li>
                <li>Copy and run the first SQL script to create tables</li>
                <li>Copy and run the second SQL script to add sample products</li>
                <li>Return to the store to see your products</li>
              </ol>
              <div className="pt-4">
                <Link href="/">
                  <Button>Return to Store</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
