import Link from "next/link"
import { GitHubIcon, TwitterIcon, DiscordIcon } from "@/components/icons"

export function Footer() {
  return (
    <footer className="py-6">
      <div className="container max-w-4xl mx-auto px-4 text-center">
        <div className="flex justify-center space-x-4 mb-4">
          <Link
            href="https://github.com/WasLostAI"
            target="_blank"
            rel="noopener noreferrer"
            className="jupiter-button-dark p-2 rounded-md"
            aria-label="GitHub"
          >
            <GitHubIcon className="h-5 w-5" />
          </Link>
          <Link
            href="https://twitter.com/WasLostAI"
            target="_blank"
            rel="noopener noreferrer"
            className="jupiter-button-dark p-2 rounded-md"
            aria-label="X (Twitter)"
          >
            <TwitterIcon className="h-5 w-5" />
          </Link>
          <Link
            href="https://discord.gg/waslostai"
            target="_blank"
            rel="noopener noreferrer"
            className="jupiter-button-dark p-2 rounded-md"
            aria-label="Discord"
          >
            <DiscordIcon className="h-5 w-5" />
          </Link>
        </div>
        <p className="caption text-[#e8f9ff]/70">
          2025 © Created by{" "}
          <Link href="https://twitter.com/WasLostAI" className="text-primary hover:underline transition-colors">
            @WasLostAI
          </Link>
        </p>
      </div>
    </footer>
  )
}
