"use client"

import Link from "next/link"
import { Github, Twitter, Linkedin, Mail } from "lucide-react"
import { GradientText } from "@/components/gradient-text"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#afcd4f] to-[#8fb83f] rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">W</span>
              </div>
              <GradientText className="text-xl font-bold font-syne">WasLost.Ai</GradientText>
            </div>
            <p className="text-white/60 text-sm">
              AI-powered insights and professional representation for the modern digital landscape.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Navigation</h3>
            <div className="space-y-2">
              <Link href="/" className="block text-white/60 hover:text-white transition-colors text-sm">
                Home
              </Link>
              <Link href="/blog" className="block text-white/60 hover:text-white transition-colors text-sm">
                Blog
              </Link>
              <Link href="/projects" className="block text-white/60 hover:text-white transition-colors text-sm">
                Projects
              </Link>
              <Link href="/contact" className="block text-white/60 hover:text-white transition-colors text-sm">
                Contact
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Resources</h3>
            <div className="space-y-2">
              <Link href="/admin" className="block text-white/60 hover:text-white transition-colors text-sm">
                Admin Panel
              </Link>
              <Link href="/rss.xml" className="block text-white/60 hover:text-white transition-colors text-sm">
                RSS Feed
              </Link>
              <Link href="/sitemap.xml" className="block text-white/60 hover:text-white transition-colors text-sm">
                Sitemap
              </Link>
            </div>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Connect</h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="mailto:contact@waslost.ai" className="text-white/60 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-white/40 text-sm">© 2024 WasLost.Ai. All rights reserved.</p>
        </div>

        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built with ❤️ by{" "}
              <Link href="/" className="font-medium underline underline-offset-4">
                WasLost.tech
              </Link>
              . The source code is available on{" "}
              <Link href="#" className="font-medium underline underline-offset-4">
                GitHub
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
