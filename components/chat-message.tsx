import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type ChatMessageProps = {
  message: {
    role: "user" | "assistant"
    content: string
  }
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-lg",
        isUser
          ? "bg-neumorphic-light neumorphic-inset" // User message: slightly lighter, inset neumorphic
          : "bg-neumorphic-base neumorphic-inset border border-border/40", // AI message: base color, inset neumorphic, subtle border
      )}
    >
      <Avatar className={cn("h-8 w-8", isUser ? "bg-muted" : "")}>
        <AvatarFallback>{isUser ? "U" : "AI"}</AvatarFallback>
        {!isUser && (
          <AvatarImage
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design%20%2838%29-3NtaTB4rUdzFs7nOwHchN5oRtxq5wQ.png"
            alt="WasLost AI"
          />
        )}
      </Avatar>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground mb-1">{isUser ? "You" : "WasLost AI"}</p>
        <div className="space-y-2">
          {message.content.split("\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
