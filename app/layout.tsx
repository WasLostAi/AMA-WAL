import type React from "react"
import type { Metadata } from "next"
import { Inter, Syne } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { WalletProviderWrapper } from "@/components/wallet-provider-wrapper"

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
  // This comment helps trigger re-evaluation in some environments.
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
          <WalletProviderWrapper>{children}</WalletProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
