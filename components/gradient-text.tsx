"use client"

import { useRef, useEffect, useState } from "react"

interface GradientTextProps {
  text: string
  className?: string
}

export function GradientText({ text, className = "" }: GradientTextProps) {
  const [dimensions, setDimensions] = useState({ width: 600, height: 80 })
  const textRef = useRef<SVGTextElement>(null)

  useEffect(() => {
    if (textRef.current) {
      const bbox = textRef.current.getBBox()
      setDimensions({
        width: Math.max(bbox.width + 40, 600), // Add padding
        height: Math.max(bbox.height + 40, 80), // Add padding
      })
    }
  }, [text])

  return (
    <div className={`inline-block ${className}`}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2ed3b7" />
            <stop offset="100%" stopColor="#c8f284" />
          </linearGradient>
        </defs>
        <text
          ref={textRef}
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="url(#textGradient)"
          fontFamily="var(--font-syne)"
          fontWeight="800"
          fontSize="40px"
        >
          {text}
        </text>
      </svg>
    </div>
  )
}
