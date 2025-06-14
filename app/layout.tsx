import type React from "react"
import type { Metadata } from "next"
import { Inter, Syne } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { WalletProviderWrapper } from "@/components/wallet-provider-wrapper" // New wrapper for Solana

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const syne = Syne({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "WasLost Ai",
  description: "Ask Me Anything!",
  icons: {
    icon: "/favicon.ico", // Use the new .ico file
    shortcut: "/favicon-96x96.png", // Optional: for older browsers/devices
    apple: "/apple-touch-icon.png", // Use the new apple touch icon
    other: [
      {
        rel: "mask-icon",
        url: "/favicon.svg", // For Safari pinned tabs
        color: "#0C0C0C", // Adjust color as needed for your design
      },
    ],
  },
  manifest: "/site.webmanifest", // Assuming you'll create this later for PWA
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`}>
      <body style={{ backgroundColor: "#0C0C0C" }} className="text-white antialiased font-inter">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <WalletProviderWrapper>
            {" "}
            {/* Wrap children with Solana wallet providers */}
            {children}
          </WalletProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
