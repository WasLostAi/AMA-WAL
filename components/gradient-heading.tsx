"use client"

interface GradientHeadingProps {
  text: string
  className?: string
}

export function GradientHeading({ text, className = "" }: GradientHeadingProps) {
  return (
    <div
      className={`inline-block ${className}`}
      style={{
        background: "linear-gradient(to right, #2ed3b7, #c8f284)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        padding: "0.2em 0 0.5em",
        width: "100%",
        textAlign: "center",
        lineHeight: 1.4,
      }}
    >
      {text}
    </div>
  )
}
