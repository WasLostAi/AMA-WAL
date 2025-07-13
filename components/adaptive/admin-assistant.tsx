"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, Bot, User, X, Minimize2, Maximize2 } from "lucide-react"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface AdminAssistantProps {
  currentMode?: string
  onModeChange?: (mode: string) => void
  onContentAction?: (action: string, data?: any) => void
}

export const AdminAssistant: React.FC<AdminAssistantProps> = ({
  currentMode = "none",
  onModeChange,
  onContentAction,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "Hello! I'm your admin assistant. I can help you manage your adaptive frontend, create content, optimize SEO, and guide you through setup processes. What would you like to work on today?",
      timestamp: new Date(),
      suggestions: ["Set up a new mode", "Generate content", "Optimize SEO", "Review analytics"],
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: generateResponse(inputValue),
        timestamp: new Date(),
        suggestions: generateSuggestions(inputValue),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1500)
  }

  const generateResponse = (input: string): string => {
    const lowerInput = input.toLowerCase()

    if (lowerInput.includes("mode") || lowerInput.includes("setup")) {
      return `I can help you set up different frontend modes. Currently you're in ${currentMode} mode. Would you like to switch to a different mode or configure the current one? I can guide you through hybrid commerce, portfolio, or landing page setups.`
    }

    if (lowerInput.includes("content") || lowerInput.includes("create")) {
      return "I can help you create and manage content for your adaptive frontend. Would you like me to generate product descriptions, blog posts, or help you organize your content library?"
    }

    if (lowerInput.includes("seo") || lowerInput.includes("optimize")) {
      return "SEO optimization is crucial for your adaptive frontend. I can help you generate meta descriptions, optimize titles, create structured data, and improve your search rankings. What specific SEO aspect would you like to work on?"
    }

    if (lowerInput.includes("analytics") || lowerInput.includes("performance")) {
      return "Let me help you analyze your performance metrics. I can provide insights on user engagement, conversion rates, and suggest optimizations based on your current mode and content performance."
    }

    return "I understand you need help with your adaptive frontend. I can assist with mode configuration, content management, SEO optimization, and performance analysis. Could you be more specific about what you'd like to accomplish?"
  }

  const generateSuggestions = (input: string): string[] => {
    const lowerInput = input.toLowerCase()

    if (lowerInput.includes("mode")) {
      return ["Switch to hybrid mode", "Configure portfolio layout", "Set up e-commerce features"]
    }

    if (lowerInput.includes("content")) {
      return ["Generate product descriptions", "Create blog post", "Optimize images"]
    }

    if (lowerInput.includes("seo")) {
      return ["Generate meta descriptions", "Optimize page titles", "Create schema markup"]
    }

    return ["Show me analytics", "Help with setup", "Generate content", "Optimize SEO"]
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="jupiter-button-dark fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-50"
        title="Open Admin Assistant"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
      }`}
    >
      <Card className="bg-neumorphic-base border-white/10 h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-neumorphic-inset flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#afcd4f]" />
            </div>
            <div>
              <CardTitle className="text-sm text-white">Admin Assistant</CardTitle>
              <Badge variant="outline" className="border-[#afcd4f] text-[#afcd4f] text-xs">
                Online
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setIsMinimized(!isMinimized)} className="jupiter-button-dark p-1 w-8 h-8">
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>
            <button onClick={() => setIsOpen(false)} className="jupiter-button-dark p-1 w-8 h-8">
              <X className="w-3 h-3" />
            </button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="flex-1 overflow-hidden p-0">
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.type === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-neumorphic-inset flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-[#afcd4f]" />
                        </div>
                      )}
                      <div className={`max-w-[80%] ${message.type === "user" ? "order-1" : ""}`}>
                        <div
                          className={`p-3 rounded-lg ${
                            message.type === "user"
                              ? "bg-neumorphic-inset text-white ml-auto"
                              : "bg-neumorphic-base text-white"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        {message.suggestions && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {message.suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="jupiter-button-dark text-xs px-2 py-1"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {message.type === "user" && (
                        <div className="w-8 h-8 rounded-full bg-neumorphic-inset flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-[#afcd4f]" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-neumorphic-inset flex items-center justify-center">
                        <Bot className="w-4 h-4 text-[#afcd4f]" />
                      </div>
                      <div className="bg-neumorphic-base p-3 rounded-lg">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-[#afcd4f] rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-[#afcd4f] rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-[#afcd4f] rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-white/10 p-4">
                  <div className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about your admin panel..."
                      className="bg-neumorphic-inset border-white/10 text-white placeholder:text-white/50"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim()}
                      className="jupiter-button-dark p-2 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}

export default AdminAssistant
