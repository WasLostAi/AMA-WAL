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
  const [isLoading, setIsLoading] = useState(false)
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0)
  const [showSuggestionsInInput, setShowSuggestionsInInput] = useState(false) // New state for input suggestions

  const initialGreeting =
    "Hello, I'm Michael Robinson's AI representative. I'm here to provide insights into his professional background and the innovative work at WasLost.Ai. How can I assist you?"
  const typingSpeed = 40 // milliseconds per character
  const typingRef = useRef<NodeJS.Timeout | null>(null)
  const suggestionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const suggestedQuestions = [
    "Can you tell me about Michael's experience in leading development teams?",
    "What kind of applications has Michael built that handled high user traffic?",
    "How has Michael's background in AI and blockchain evolved?",
    "What is Michael's approach to product development and team collaboration?",
    "Could you elaborate on Michael's technical proficiencies?",
    "What are some of the key achievements from Michael's career?",
    "Where can I find more information about WasLost.Ai's mission?",
  ]

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
        setMessages([{ role: "assistant", content: initialGreeting }])
        setShowSuggestionsInInput(true) // Start showing suggestions in input after initial greeting
      }
    }, typingSpeed)

    return () => {
      if (typingRef.current) clearInterval(typingRef.current)
    }
  }, [])

  useEffect(() => {
    if (showSuggestionsInInput && !inputValue) {
      // Only cycle if input is empty
      suggestionIntervalRef.current = setInterval(() => {
        setCurrentSuggestionIndex((prevIndex) => (prevIndex + 1) % suggestedQuestions.length)
      }, 5000) // Change suggestion every 5 seconds
    } else {
      if (suggestionIntervalRef.current) clearInterval(suggestionIntervalRef.current)
    }
    return () => {
      if (suggestionIntervalRef.current) clearInterval(suggestionIntervalRef.current)
    }
  }, [showSuggestionsInInput, inputValue, suggestedQuestions.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: inputValue.trim() }
    setMessages((prevMessages) => [...prevMessages, userMessage])
    setInputValue("")
    setIsLoading(true)
    setShowSuggestionsInInput(false) // Hide suggestions once user starts typing/submitting

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputValue.trim(),
          history: [...messages, userMessage],
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
      setIsLoading(false)
      setShowSuggestionsInInput(true) // Show suggestions again after AI responds
    }
  }

  const handleInputClick = () => {
    if (!inputValue && showSuggestionsInInput && !isLoading && !isTypingInitial) {
      setInputValue(suggestedQuestions[currentSuggestionIndex])
      if (suggestionIntervalRef.current) clearInterval(suggestionIntervalRef.current) // Stop cycling when filled
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto fade-in">
      <div className="jupiter-outer-panel p-6 mb-8">
        <div className="jupiter-panel p-4 flex flex-col gap-4 mb-6 max-h-[400px] overflow-y-auto">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
          {isTypingInitial && (
            <div className="flex gap-3 p-4 rounded-lg bg-black/30 border border-border/40">
              <AiAvatar />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">WasLost AI</p>
                <div className="space-y-2">
                  <p>
                    {displayedInitialText}
                    <span className="typing-cursor"></span>
                  </p>
                </div>
              </div>
            </div>
          )}
          {isLoading && (
            <div className="flex gap-3 p-4 rounded-lg bg-black/30 border border-border/40">
              <AiAvatar />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">WasLost AI</p>
                <div className="space-y-2">
                  <p className="matrix-loading">Thinking...</p>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              // Stop cycling suggestions if user starts typing
              if (suggestionIntervalRef.current) clearInterval(suggestionIntervalRef.current)
            }}
            onClick={handleInputClick} // Handle click to fill input
            placeholder={
              showSuggestionsInInput && !isLoading && !isTypingInitial && !inputValue
                ? suggestedQuestions[currentSuggestionIndex]
                : "Ask me about WasLost.Ai or Michael..."
            }
            className="flex-1 px-3 py-2"
            disabled={isLoading || isTypingInitial}
          />
          <Button
            type="submit"
            className="jupiter-button-dark h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base"
            disabled={isLoading || isTypingInitial}
          >
            AMA!
          </Button>
        </form>
      </div>
    </div>
  )
}
