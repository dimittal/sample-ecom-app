import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/lib/cart-context"
import { TelemetryProvider } from "@/components/telemetry-provider";


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TechStore - Your Electronics Destination",
  description: "Shop the latest tech accessories and gadgets",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TelemetryProvider>
          <CartProvider>{children}</CartProvider>
        </TelemetryProvider>
      </body>
    </html>
  )
}
