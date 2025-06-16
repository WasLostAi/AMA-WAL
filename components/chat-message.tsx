import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { AiAvatar } from "./ai-avatar" // Import AiAvatar

type ChatMessageProps = {
  message: {
    role: "user" | "assistant"
    content: string
  }
  aiAvatarSrc?: string // New prop for AI avatar source
}

export function ChatMessage({ message, aiAvatarSrc }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-lg",
        isUser ? "bg-neumorphic-light neumorphic-inset" : "bg-neumorphic-base neumorphic-inset border border-border/40",
      )}
    >
      <Avatar className={cn("h-8 w-8", isUser ? "bg-muted" : "")}>
        {isUser ? <AvatarFallback>U</AvatarFallback> : <AiAvatar src={aiAvatarSrc} />}
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
