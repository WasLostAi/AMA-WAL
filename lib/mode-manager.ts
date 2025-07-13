"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ModeType =
  | "traditional-portfolio"
  | "traditional-blog"
  | "traditional-ecommerce"
  | "hybrid-commerce"
  | "monetized-agent"
  | "agentic-ui"

export interface ModeConfig {
  id: ModeType
  name: string
  components: ComponentConfig[]
  layout: LayoutConfig
  features: string[]
  restrictions?: string[]
  theme?: ThemeConfig
}

export interface ComponentConfig {
  type: string
  position: "header" | "main" | "sidebar" | "footer" | "overlay"
  props: Record<string, any>
  conditional?: string
  priority?: number
}

export interface LayoutConfig {
  hasHeader: boolean
  hasSidebar: boolean
  hasFooter: boolean
  hasOverlay: boolean
  mainLayout: "single" | "split" | "grid" | "dashboard" | "fullscreen"
  sidebarPosition?: "left" | "right"
  headerStyle?: "minimal" | "standard" | "enhanced"
}

export interface ThemeConfig {
  primaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  borderColor: string
}

interface ModeStore {
  currentMode: ModeType | null
  modeConfig: ModeConfig | null
  isLoading: boolean
  isTransitioning: boolean
  setMode: (mode: ModeType) => Promise<void>
  updateConfig: (config: Partial<ModeConfig>) => void
  resetMode: () => void
  previewMode: (mode: ModeType) => void
  exitPreview: () => void
  isPreviewMode: boolean
  previewConfig: ModeConfig | null
}

const MODE_CONFIGURATIONS: Record<ModeType, ModeConfig> = {
  "traditional-portfolio": {
    id: "traditional-portfolio",
    name: "Portfolio Mode",
    components: [
      { type: "header", position: "header", props: { showNav: true }, priority: 1 },
      { type: "portfolio-grid", position: "main", props: { columns: 3 }, priority: 3 },
      {
        type: "chat-widget",
        position: "overlay",
        props: { optional: true },
        conditional: "ai-chat-enabled",
        priority: 10,
      },
      { type: "footer", position: "footer", props: {}, priority: 99 },
    ],
    layout: {
      hasHeader: true,
      hasSidebar: false,
      hasFooter: true,
      hasOverlay: true,
      mainLayout: "single",
      headerStyle: "standard",
    },
    features: ["project-showcase", "skills-display", "contact-forms", "optional-ai-chat", "seo-optimization"],
    theme: {
      primaryColor: "#afcd4f",
      accentColor: "#ffffff",
      backgroundColor: "#0C0C0C",
      textColor: "#ffffff",
      borderColor: "rgba(255,255,255,0.1)",
    },
  },
  "traditional-blog": {
    id: "traditional-blog",
    name: "Blog Mode",
    components: [
      { type: "header", position: "header", props: { showSearch: true }, priority: 1 },
      { type: "blog-layout", position: "main", props: {}, priority: 3 },
      { type: "sidebar", position: "sidebar", props: { showCategories: true }, priority: 4 },
      { type: "footer", position: "footer", props: {}, priority: 99 },
    ],
    layout: {
      hasHeader: true,
      hasSidebar: true,
      hasFooter: true,
      hasOverlay: false,
      mainLayout: "single",
    },
    features: ["article-management", "seo-optimization", "ai-content-discovery", "comment-moderation"],
  },
  "traditional-ecommerce": {
    id: "traditional-ecommerce",
    name: "E-commerce Mode",
    components: [
      { type: "header", position: "header", props: { showCart: true }, priority: 1 },
      { type: "product-catalog", position: "main", props: {}, priority: 3 },
      { type: "ai-assistant", position: "main", props: { type: "shopping" }, priority: 7 },
      { type: "footer", position: "footer", props: {}, priority: 99 },
    ],
    layout: {
      hasHeader: true,
      hasSidebar: false,
      hasFooter: true,
      hasOverlay: true,
      mainLayout: "grid",
    },
    features: ["product-catalog", "shopping-cart", "order-management", "ai-recommendations"],
  },
  "hybrid-commerce": {
    id: "hybrid-commerce",
    name: "2.0+ Hybrid Mode",
    components: [
      { type: "header", position: "header", props: { minimal: true }, priority: 1 },
      { type: "chat-interface", position: "main", props: { enhanced: true }, priority: 2 },
      { type: "micro-shop", position: "sidebar", props: { dynamic: true }, priority: 3 },
    ],
    layout: {
      hasHeader: true,
      hasSidebar: true,
      hasFooter: false,
      hasOverlay: true,
      mainLayout: "split",
    },
    features: ["ai-recommendations", "dynamic-product-display", "context-aware-shopping", "micro-shop-integration"],
  },
  "monetized-agent": {
    id: "monetized-agent",
    name: "3.0 Monetized Agent",
    components: [
      { type: "header", position: "header", props: { minimal: true }, priority: 1 },
      { type: "premium-chat", position: "main", props: { advanced: true }, priority: 2 },
      { type: "booking-system", position: "sidebar", props: {}, priority: 3 },
      { type: "payment-integration", position: "main", props: {}, priority: 6 },
    ],
    layout: {
      hasHeader: false,
      hasSidebar: true,
      hasFooter: false,
      hasOverlay: true,
      mainLayout: "split",
    },
    features: [
      "advanced-ai-personality",
      "transactional-capabilities",
      "deep-knowledge-integration",
      "premium-interactions",
    ],
  },
  "agentic-ui": {
    id: "agentic-ui",
    name: "4.0 Agentic UI",
    components: [
      { type: "header", position: "header", props: {}, priority: 1 },
      { type: "command-center", position: "main", props: {}, priority: 2 },
      { type: "dynamic-dashboard", position: "main", props: {}, priority: 3 },
      { type: "admin-chat", position: "sidebar", props: {}, priority: 4 },
    ],
    layout: {
      hasHeader: true,
      hasSidebar: true,
      hasFooter: false,
      hasOverlay: true,
      mainLayout: "dashboard",
    },
    features: ["natural-language-admin", "voice-commands", "dynamic-dashboards", "advanced-automation"],
  },
}

export const useModeStore = create<ModeStore>()(
  persist(
    (set, get) => ({
      currentMode: null,
      modeConfig: null,
      isLoading: false,
      isTransitioning: false,
      isPreviewMode: false,
      previewConfig: null,

      setMode: async (mode: ModeType) => {
        set({ isLoading: true, isTransitioning: true })

        try {
          // Simulate API call to update mode configuration
          await new Promise((resolve) => setTimeout(resolve, 1500))

          const config = MODE_CONFIGURATIONS[mode]
          set({
            currentMode: mode,
            modeConfig: config,
            isLoading: false,
            isTransitioning: false,
            isPreviewMode: false,
            previewConfig: null,
          })
        } catch (error) {
          console.error("Failed to set mode:", error)
          set({ isLoading: false, isTransitioning: false })
          throw error
        }
      },

      updateConfig: (configUpdate: Partial<ModeConfig>) => {
        const { modeConfig } = get()
        if (modeConfig) {
          set({
            modeConfig: { ...modeConfig, ...configUpdate },
          })
        }
      },

      resetMode: () => {
        set({
          currentMode: null,
          modeConfig: null,
          isLoading: false,
          isTransitioning: false,
          isPreviewMode: false,
          previewConfig: null,
        })
      },

      previewMode: (mode: ModeType) => {
        const config = MODE_CONFIGURATIONS[mode]
        set({
          isPreviewMode: true,
          previewConfig: config,
        })
      },

      exitPreview: () => {
        set({
          isPreviewMode: false,
          previewConfig: null,
        })
      },
    }),
    {
      name: "mode-storage",
      partialize: (state) => ({
        currentMode: state.currentMode,
        modeConfig: state.modeConfig,
      }),
    },
  ),
)

export const getModeFeatures = (mode: ModeType): string[] => {
  return MODE_CONFIGURATIONS[mode]?.features || []
}

export const isModeFeatureEnabled = (mode: ModeType, feature: string): boolean => {
  const features = getModeFeatures(mode)
  return features.includes(feature)
}

export const getModeConfig = (mode: ModeType): ModeConfig | null => {
  return MODE_CONFIGURATIONS[mode] || null
}

export const getAvailableModes = (): ModeType[] => {
  return Object.keys(MODE_CONFIGURATIONS) as ModeType[]
}

export const validateModeTransition = (from: ModeType | null, to: ModeType): boolean => {
  // Add any business logic for mode transition validation
  // For now, all transitions are allowed
  return true
}
