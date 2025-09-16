import Link from "next/link"
import { GitHubIcon, TwitterIcon, DiscordIcon } from "@/components/icons"
import { LightIndicator } from "./light-indicator" // Import the new component

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
        <p className="caption text-[#e8f9ff]/70 mb-4">
          2025 © Created by{" "}
          <Link href="https://twitter.com/WasLostAI" className="text-[#afcd4f] hover:no-underline transition-colors">
            @WasLostAI
          </Link>
        </p>
        {/* Light Indicators */}
        <div className="flex justify-center space-x-4 mt-4">
          <LightIndicator colorVar="--light-green" isOn={true} href="/projects" label="Project Repository" />
          <LightIndicator colorVar="--light-blue" isOn={true} href="/blog" label="Writing Repository (Blog)" />
          <LightIndicator
            colorVar="--darker-green"
            isOn={false}
            href="#" // Placeholder for future section
            label="Future Section (Inactive)"
          />
        </div>
      </div>
    </footer>
  )
}
