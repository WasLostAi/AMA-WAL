import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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
  },
)
Textarea.displayName = "Textarea"

export { Textarea }
