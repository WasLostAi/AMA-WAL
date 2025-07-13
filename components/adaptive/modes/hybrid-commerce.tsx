"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Star } from "lucide-react"
import { ChatInterface } from "@/components/chat-interface"
import type { ModeConfig } from "@/lib/mode-manager"
import Image from "next/image"

interface HybridCommerceProps {
  config: ModeConfig
}

interface Product {
  id: string
  name: string
  price: number
  image: string
  description: string
  rating: number
  inStock: boolean
  featured?: boolean
}

// Mock products - in real implementation, this would come from the content management system
const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "AI Strategy Consultation",
    price: 299,
    image: "/placeholder.svg?height=200&width=200",
    description: "1-hour deep dive into AI implementation for your business",
    rating: 4.9,
    inStock: true,
    featured: true,
  },
  {
    id: "2",
    name: "Custom AI Agent Development",
    price: 2499,
    image: "/placeholder.svg?height=200&width=200",
    description: "Fully custom AI agent tailored to your specific needs",
    rating: 5.0,
    inStock: true,
    featured: true,
  },
  {
    id: "3",
    name: "AI Training Workshop",
    price: 149,
    image: "/placeholder.svg?height=200&width=200",
    description: "Learn to implement AI in your workflow - 2-hour session",
    rating: 4.8,
    inStock: true,
  },
  {
    id: "4",
    name: "Monthly AI Optimization",
    price: 499,
    image: "/placeholder.svg?height=200&width=200",
    description: "Ongoing AI system optimization and improvements",
    rating: 4.7,
    inStock: true,
  },
]

export default function HybridCommerce({ config }: HybridCommerceProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [cartItems, setCartItems] = useState<Product[]>([])

  const handleProductSelect = (product: Product) => {
    if (!cartItems.find((item) => item.id === product.id)) {
      setCartItems([...cartItems, product])
    }
  }

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== productId))
  }

  const featuredProducts = SAMPLE_PRODUCTS.filter((p) => p.featured).slice(0, 4)

  return (
    <div className="min-h-screen bg-[#0C0C0C] flex">
      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="neumorphic-base border-b border-border/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#afcd4f] font-syne">AI Services Hub</h1>
              <p className="text-white/60 text-sm">Chat with our AI to find the perfect solution</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-[#afcd4f] border-[#afcd4f]">
                Hybrid Commerce Mode
              </Badge>
              {cartItems.length > 0 && (
                <Button variant="outline" className="relative bg-transparent">
                  <ShoppingCart className="h-4 w-4" />
                  <Badge className="absolute -top-2 -right-2 bg-[#afcd4f] text-black text-xs">{cartItems.length}</Badge>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Chat Interface */}
        <div className="flex-1 p-4">
          <ChatInterface
            className="h-full"
            placeholder="Ask me about our AI services, pricing, or get personalized recommendations..."
            onProductRecommendation={handleProductSelect}
          />
        </div>
      </div>

      {/* Micro-Shop Sidebar */}
      <div className="w-96 neumorphic-base border-l border-border/20 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border/20">
          <h2 className="text-lg font-bold text-white font-syne">Featured Services</h2>
          <p className="text-white/60 text-sm">AI-powered recommendations</p>
        </div>

        {/* Featured Products Grid */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {featuredProducts.map((product) => (
              <Card
                key={product.id}
                className="neumorphic-inset cursor-pointer hover:bg-neumorphic-light/50 transition-all duration-300 group"
                onClick={() => handleProductSelect(product)}
              >
                <CardContent className="p-3">
                  <div className="relative mb-2">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      width={120}
                      height={80}
                      className="w-full h-20 object-cover rounded-md"
                    />
                    <div className="absolute top-1 right-1">
                      <Badge className="bg-[#afcd4f] text-black text-xs">${product.price}</Badge>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">{product.name}</h3>
                  <p className="text-xs text-white/60 mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-white/80">{product.rating}</span>
                    </div>
                    <Button
                      size="sm"
                      className="h-6 px-2 text-xs jupiter-button-dark group-hover:bg-[#afcd4f] group-hover:text-black"
                    >
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Cart Summary */}
          {cartItems.length > 0 && (
            <Card className="neumorphic-base border border-[#afcd4f]/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#afcd4f]">Your Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="text-white truncate flex-1">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#afcd4f] font-semibold">${item.price}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 text-red-400 hover:text-red-300"
                        onClick={() => removeFromCart(item.id)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="border-t border-border/20 pt-2 mt-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-white">Total:</span>
                    <span className="text-[#afcd4f]">${cartItems.reduce((sum, item) => sum + item.price, 0)}</span>
                  </div>
                  <Button className="w-full mt-2 jupiter-button-dark bg-[#afcd4f] text-black hover:bg-[#afcd4f]/90">
                    Checkout
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Products */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">All Services</h3>
            {SAMPLE_PRODUCTS.map((product) => (
              <Card
                key={product.id}
                className="neumorphic-inset cursor-pointer hover:bg-neumorphic-light/50 transition-all duration-300"
                onClick={() => handleProductSelect(product)}
              >
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      width={60}
                      height={60}
                      className="w-15 h-15 object-cover rounded-md flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white mb-1 truncate">{product.name}</h4>
                      <p className="text-xs text-white/60 mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#afcd4f]">${product.price}</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-white/80">{product.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
