"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface LightIndicatorProps {
  colorVar: string // CSS variable name, e.g., '--light-green'
  isOn: boolean
  href: string
  label: string
}

export function LightIndicator({ colorVar, isOn, href, label }: LightIndicatorProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative w-4 h-4 rounded-full transition-all duration-300 ease-in-out",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
        "flex items-center justify-center", // Center content if any, for visual consistency
        isOn ? "opacity-100" : "opacity-30",
      )}
      style={{
        backgroundColor: `var(${colorVar})`,
        boxShadow: isOn
          ? `inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(255,255,255,0.2), 0 0 5px 1px var(${colorVar})` // Recessed with subtle glow
          : `inset 2px 2px 4px var(--neumorphic-dark), inset -2px -2px 4px var(--neumorphic-light)`, // Recessed when off
      }}
      aria-label={label}
    >
      {/* No separate pulse span, glow is part of box-shadow now */}
    </Link>
  )
}
