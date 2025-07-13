import type React from "react"
import type { Metadata } from "next"
import { Inter, Syne } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header" // Assuming Header exists and is needed
import { Footer } from "@/components/footer" // Assuming Footer exists and is needed
import WalletProviderWrapper from "@/components/wallet-provider-wrapper" // Corrected to default import

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
    icon: "/favicon.svg",
    shortcut: "/favicon-96x96.png",
    apple: "/apple-touch-icon.png",
    other: [
      {
        rel: "mask-icon",
        url: "/favicon.svg",
        color: "#0C0C0C",
      },
    ],
  },
  manifest: "/site.webmanifest",
  generator: "v0.dev",
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
            {/* Assuming Header and Footer are part of the main layout */}
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </WalletProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
