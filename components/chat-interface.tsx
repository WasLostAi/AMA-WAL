"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChatMessage } from "@/components/chat-message"
import { AiAvatar } from "@/components/ai-avatar"

type Message = {
  role: "user" | "assistant"
  content: string
}

export function ChatInterface() {
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isTypingInitial, setIsTypingInitial] = useState(true)
  const [displayedInitialText, setDisplayedInitialText] = useState("")
  const [isLoading, setIsLoading] = useState(false) // New state for loading
  const initialGreeting = "Hi, I'm Michael Robinson's AI representative. How can I help you today?"
  const typingSpeed = 40 // milliseconds per character
  const typingRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null) // Ref for scrolling to bottom

  useEffect(() => {
    let i = 0
    setIsTypingInitial(true)

    typingRef.current = setInterval(() => {
      if (i < initialGreeting.length) {
        setDisplayedInitialText(initialGreeting.substring(0, i + 1))
        i++
      } else {
        if (typingRef.current) clearInterval(typingRef.current)
        setIsTypingInitial(false)
        // Add initial greeting to messages after typing animation
        setMessages([{ role: "assistant", content: initialGreeting }])
      }
    }, typingSpeed)

    return () => {
      if (typingRef.current) clearInterval(typingRef.current)
    }
  }, [])

  // Scroll to bottom of messages whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: inputValue.trim() }
    setMessages((prevMessages) => [...prevMessages, userMessage])
    setInputValue("")
    setIsLoading(true) // Set loading state

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputValue.trim(),
          history: [...messages, userMessage], // Send full history
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const aiResponse: Message = { role: "assistant", content: data.text }
      setMessages((prevMessages) => [...prevMessages, aiResponse])
    } catch (error) {
      console.error("Error submitting message:", error)
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again later." },
      ])
    } finally {
      setIsLoading(false) // Clear loading state
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto fade-in">
      {/* Outer glass panel */}
      <div className="jupiter-outer-panel p-6 mb-8">
        {/* Chat history display area */}
        <div className="jupiter-panel p-4 flex flex-col gap-4 mb-6 max-h-[400px] overflow-y-auto">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
          {isLoading && (
            <div className="flex gap-3 p-4 rounded-lg bg-black/30 border border-border/40">
              <AiAvatar />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">WasLost AI</p>
                <div className="space-y-2">
                  <p className="matrix-loading">Thinking...</p> {/* Loading indicator */}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} /> {/* Scroll anchor */}
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me about WasLost.Ai or Michael..."
            className="flex-1 px-3 py-2"
            disabled={isLoading} // Disable input while loading
          />
          <Button
            type="submit"
            className="jupiter-button-dark h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base" // Explicitly set background and hover background
            disabled={isLoading}
          >
            AMA!
          </Button>
        </form>
      </div>
    </div>
  )
}
