"use client"

import { Button } from "@/components/ui/button"

export function W4UILanding() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Background geometric patterns */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Grid lines */}
          <svg className="w-full h-full" viewBox="0 0 1920 1080">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#afcd4f" strokeWidth="0.5" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Diagonal lines */}
          <div className="absolute inset-0">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute bg-gradient-to-r from-transparent via-[#afcd4f] to-transparent opacity-20"
                style={{
                  width: "2px",
                  height: "200%",
                  left: `${i * 10}%`,
                  top: "-50%",
                  transform: `rotate(${15 + i * 2}deg)`,
                  transformOrigin: "center",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Code snippet overlays */}
      <div className="absolute top-20 right-10 bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 font-mono text-sm text-[#afcd4f] max-w-md">
        <div className="opacity-70">
          {'<div className="carousel-control" href="#myCarousel" role="button"'}
          <br />
          {'  data-slide="prev">'}
          <br />
          {'  <span className="glyphicon glyphicon-chevron-left" aria-hidden="true">'}
          <br />
          {'  <span className="sr-only">Previous</span>'}
          <br />
          {"</div>"}
        </div>
      </div>

      <div className="absolute bottom-32 right-20 bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 font-mono text-sm text-[#afcd4f] max-w-sm">
        <div className="opacity-70">
          {"// .carousel -->"}
          <br />
          {'<div className="content-section">'}
          <br />
          {"  <h2>FEATURED CONTENT</h2>"}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-between min-h-screen px-8 lg:px-16">
        {/* Left side - Text content */}
        <div className="flex-1 max-w-2xl">
          {/* W4UI Logo */}
          <div className="mb-8">
            <div className="text-[#afcd4f] font-mono text-6xl lg:text-8xl font-bold tracking-wider pixel-art">W4UI</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-[#afcd4f] rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-[#afcd4f] rounded-full animate-pulse delay-100"></div>
              <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
            </div>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
            One app,
            <br />
            all things
            <br />
            <span className="text-[#afcd4f]">Web4.</span>
          </h1>

          {/* Sparkle decorations */}
          <div className="absolute -top-4 right-20 text-white text-4xl animate-pulse">✦</div>
          <div className="absolute top-10 right-32 text-white text-2xl animate-pulse delay-300">✧</div>

          {/* Description */}
          <p className="text-xl lg:text-2xl text-gray-300 mb-8 leading-relaxed max-w-xl">
            One UI for All of your Web4 needs. Create, Share, and Manage Amazing Content! Monetize, Promote, Manage your
            Communities, and Earn! W4UI has everything covered, all in one place.
          </p>

          {/* CTA Button */}
          <Button
            className="bg-[#afcd4f] hover:bg-[#9bb847] text-black font-bold text-xl px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-[#afcd4f]/25"
            size="lg"
          >
            SIGN UP NOW ↗
          </Button>
        </div>

        {/* Right side - Code display */}
        <div className="hidden lg:block flex-1 max-w-2xl">
          <div className="relative">
            {/* Main code window */}
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl p-6 font-mono text-sm border border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="ml-4 text-gray-400">terminal</span>
              </div>

              <div className="space-y-2 text-[#afcd4f]">
                <div className="opacity-80">{'<section className="hero-section">'}</div>
                <div className="opacity-60 ml-4">{'<div className="container">'}</div>
                <div className="opacity-80 ml-8">{"<h1>Welcome to Web4</h1>"}</div>
                <div className="opacity-60 ml-8">{"<p>The future of decentralized web</p>"}</div>
                <div className="opacity-40 ml-4">{"</div>"}</div>
                <div className="opacity-80">{"</section>"}</div>
                <div className="mt-4 opacity-60">{"// Building the future..."}</div>
                <div className="opacity-40">{"npm run build"}</div>
                <div className="text-green-400 opacity-80">{"✓ Compiled successfully"}</div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-[#afcd4f] text-black px-3 py-1 rounded-full text-xs font-bold">
              LIVE
            </div>

            <div className="absolute -bottom-4 -left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              BUILDING
            </div>
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 px-8 py-4">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>System Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#afcd4f] rounded-full"></div>
              <span>Web4 Ready</span>
            </div>
          </div>
          <div>
            <span className="font-mono">v4.0.1</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pixel-art {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
      `}</style>
    </div>
  )
}
