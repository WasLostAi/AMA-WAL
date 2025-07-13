"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Zap, User, ShoppingCart, FileText, Crown, Palette } from "lucide-react"

interface Mode {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  features: string[]
  recommended?: boolean
}

interface ModeSelectorProps {
  currentMode?: string
  onModeSelect: (modeId: string) => void
}

const AVAILABLE_MODES: Mode[] = [
  {
    id: "traditional-portfolio",
    name: "Traditional Portfolio",
    description: "Clean, professional portfolio showcase",
    icon: <User className="h-6 w-6" />,
    features: ["Project showcase", "Skills display", "Contact forms", "Resume download"],
    recommended: true,
  },
  {
    id: "traditional-blog",
    name: "Traditional Blog",
    description: "Content-focused blog with SEO optimization",
    icon: <FileText className="h-6 w-6" />,
    features: ["Blog posts", "Categories", "SEO optimization", "Comment system"],
  },
  {
    id: "traditional-ecommerce",
    name: "Traditional E-commerce",
    description: "Full-featured online store",
    icon: <ShoppingCart className="h-6 w-6" />,
    features: ["Product catalog", "Shopping cart", "Payment processing", "Order management"],
  },
  {
    id: "hybrid-commerce",
    name: "Hybrid Commerce",
    description: "Portfolio + E-commerce combination",
    icon: <Zap className="h-6 w-6" />,
    features: ["Portfolio showcase", "Product sales", "Service booking", "Content marketing"],
  },
  {
    id: "monetized-agent",
    name: "Monetized Agent",
    description: "AI agent with premium features",
    icon: <Crown className="h-6 w-6" />,
    features: ["AI interactions", "Premium tiers", "Usage analytics", "Custom training"],
  },
  {
    id: "agentic-ui",
    name: "Agentic UI",
    description: "Dynamic AI-driven interface",
    icon: <Palette className="h-6 w-6" />,
    features: ["Adaptive layout", "AI recommendations", "Personalization", "Smart content"],
  },
]

export function ModeSelector({ currentMode, onModeSelect }: ModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<string>(currentMode || "")

  const handleModeSelect = (modeId: string) => {
    setSelectedMode(modeId)
    onModeSelect(modeId)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#afcd4f] mb-2">Choose Your Frontend Mode</h2>
        <p className="text-white/70">Select the mode that best fits your use case</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AVAILABLE_MODES.map((mode) => (
          <Card
            key={mode.id}
            className={`neumorphic-base cursor-pointer transition-all duration-200 ${
              selectedMode === mode.id ? "ring-2 ring-[#afcd4f]" : ""
            }`}
            onClick={() => handleModeSelect(mode.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neumorphic-inset text-[#afcd4f]">{mode.icon}</div>
                  <div>
                    <CardTitle className="text-white text-lg">{mode.name}</CardTitle>
                    {mode.recommended && <Badge className="bg-[#afcd4f] text-black text-xs mt-1">Recommended</Badge>}
                  </div>
                </div>
                {selectedMode === mode.id && <Check className="h-5 w-5 text-[#afcd4f]" />}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-white/70 text-sm mb-4">{mode.description}</p>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#afcd4f]">Features:</p>
                <ul className="space-y-1">
                  {mode.features.map((feature, index) => (
                    <li key={index} className="text-xs text-white/60 flex items-center gap-2">
                      <div className="w-1 h-1 bg-[#afcd4f] rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedMode && (
        <div className="text-center">
          <Button className="jupiter-button-dark" onClick={() => onModeSelect(selectedMode)}>
            Activate {AVAILABLE_MODES.find((m) => m.id === selectedMode)?.name} Mode
          </Button>
        </div>
      )}
    </div>
  )
}
