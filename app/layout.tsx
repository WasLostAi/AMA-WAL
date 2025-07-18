import type React from "react"
import type { Metadata } from "next"
import { Inter, Syne } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { WalletProviderWrapper } from "@/components/wallet-provider-wrapper"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DomainGuard } from "@/components/domain-guard"

const inter = Inter({ subsets: ["latin"] })
const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
})

export const metadata: Metadata = {
  title: "WasLost.tech - AI-Powered Web4 Platform",
  description: "Advanced AI chatbot and content management platform for Web4 applications",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${syne.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <WalletProviderWrapper>
            <DomainGuard>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            </DomainGuard>
          </WalletProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
