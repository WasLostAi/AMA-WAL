"use client"

import type React from "react"
import { useModeStore } from "@/lib/mode-manager"
import { Suspense, lazy } from "react"
import { Loader2 } from "lucide-react"

// Lazy load mode-specific components
const TraditionalPortfolio = lazy(() => import("./modes/traditional-portfolio"))
const TraditionalBlog = lazy(() => import("./modes/traditional-blog"))
const TraditionalEcommerce = lazy(() => import("./modes/traditional-ecommerce"))
const HybridCommerce = lazy(() => import("./modes/hybrid-commerce"))
const MonetizedAgent = lazy(() => import("./modes/monetized-agent"))
const AgenticUI = lazy(() => import("./modes/agentic-ui"))

interface AdaptiveLayoutProps {
  children?: React.ReactNode
  className?: string
}

const LoadingSpinner = () => (
  <div className="min-h-screen bg-[#0C0C0C] flex items-center justify-center">
    <div className="neumorphic-base p-8 rounded-lg text-center">
      <Loader2 className="h-12 w-12 animate-spin text-[#afcd4f] mx-auto mb-4" />
      <p className="text-white text-lg">Loading your experience...</p>
      <p className="text-white/60 text-sm mt-2">Configuring adaptive interface</p>
    </div>
  </div>
)

const ModeTransition = () => (
  <div className="fixed inset-0 bg-[#0C0C0C] z-50 flex items-center justify-center">
    <div className="neumorphic-base p-12 rounded-lg text-center max-w-md">
      <div className="relative mb-6">
        <div className="h-16 w-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-[#afcd4f]/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#afcd4f] border-t-transparent animate-spin"></div>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-[#afcd4f] mb-2 font-syne">Transforming Interface</h3>
      <p className="text-white/80">Adapting to your selected mode...</p>
      <div className="mt-4 flex justify-center space-x-1">
        <div className="h-2 w-2 bg-[#afcd4f] rounded-full animate-pulse"></div>
        <div className="h-2 w-2 bg-[#afcd4f] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
        <div className="h-2 w-2 bg-[#afcd4f] rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
      </div>
    </div>
  </div>
)

export function AdaptiveLayout({ children, className }: AdaptiveLayoutProps) {
  const { currentMode, modeConfig, isLoading, isTransitioning, isPreviewMode, previewConfig } = useModeStore()

  // Show transition overlay when switching modes
  if (isTransitioning) {
    return <ModeTransition />
  }

  // Use preview config if in preview mode, otherwise use current config
  const activeConfig = isPreviewMode ? previewConfig : modeConfig
  const activeMode = isPreviewMode ? previewConfig?.id : currentMode

  // If no mode is selected, show mode selector
  if (!activeMode || !activeConfig) {
    return <div className={`min-h-screen bg-[#0C0C0C] ${className}`}>{children}</div>
  }

  // Render the appropriate mode component
  const renderModeComponent = () => {
    switch (activeMode) {
      case "traditional-portfolio":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <TraditionalPortfolio config={activeConfig} />
          </Suspense>
        )
      case "traditional-blog":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <TraditionalBlog config={activeConfig} />
          </Suspense>
        )
      case "traditional-ecommerce":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <TraditionalEcommerce config={activeConfig} />
          </Suspense>
        )
      case "hybrid-commerce":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <HybridCommerce config={activeConfig} />
          </Suspense>
        )
      case "monetized-agent":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <MonetizedAgent config={activeConfig} />
          </Suspense>
        )
      case "agentic-ui":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AgenticUI config={activeConfig} />
          </Suspense>
        )
      default:
        return (
          <div className="min-h-screen bg-[#0C0C0C] flex items-center justify-center">
            <div className="neumorphic-base p-8 rounded-lg text-center">
              <h2 className="text-2xl font-bold text-[#afcd4f] mb-4">Mode Not Found</h2>
              <p className="text-white/80">The selected mode is not available.</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className={`min-h-screen bg-[#0C0C0C] transition-all duration-500 ${className}`}>
      {isPreviewMode && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-[#afcd4f] text-black px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            🔍 Preview Mode: {activeConfig.name}
          </div>
        </div>
      )}
      {renderModeComponent()}
    </div>
  )
}
