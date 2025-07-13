import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        "bg-neumorphic-base", // Base color
        "shadow-inner-neumorphic", // Custom inner shadow for debossed effect
        "border-none", // Remove default border
        "pl-4 pr-3 py-2", // Increased left padding, consistent right/vertical padding
        "text-left placeholder:text-left", // Ensure text and placeholder are left-aligned
        "placeholder:text-muted-foreground", // Keep placeholder color
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
