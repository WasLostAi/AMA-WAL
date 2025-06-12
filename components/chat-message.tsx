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
    <div className={cn("flex gap-3 p-4 rounded-lg", isUser ? "bg-muted/30" : "bg-black/30 border border-border/40")}>
      <Avatar className={cn("h-8 w-8", isUser ? "bg-muted" : "bg-primary/20")}>
        <AvatarFallback>{isUser ? "U" : "AI"}</AvatarFallback>
        {!isUser && <AvatarImage src="/placeholder.svg?height=32&width=32" alt="QuickNode AI" />}
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
