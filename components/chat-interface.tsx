"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChatMessage } from "@/components/chat-message"
import { AiAvatar } from "@/components/ai-avatar" // Ensure AiAvatar is imported

interface ChatInterfaceProps {
  initialGreeting: string
  aiAvatarSrc?: string
}

type Message = {
  role: "user" | "assistant"
  content: string
}

export function ChatInterface({ initialGreeting, aiAvatarSrc }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isTypingInitial, setIsTypingInitial] = useState(true)
  const [displayedInitialText, setDisplayedInitialText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0)
  const [showSuggestionsInInput, setShowSuggestionsInInput] = useState(false)

  const typingSpeed = 40 // milliseconds per character
  const typingRef = useRef<NodeJS.Timeout | null>(null)
  const suggestionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Effect for initial greeting typing animation
  useEffect(() => {
    let i = 0
    setIsTypingInitial(true)
    setDisplayedInitialText("") // Clear previous text on prop change

    if (typingRef.current) clearInterval(typingRef.current) // Clear any existing interval

    typingRef.current = setInterval(() => {
      if (i < initialGreeting.length) {
        setDisplayedInitialText(initialGreeting.substring(0, i + 1))
        i++
      } else {
        if (typingRef.current) clearInterval(typingRef.current)
        setIsTypingInitial(false)
        setMessages([{ role: "assistant", content: initialGreeting }])
        setShowSuggestionsInInput(true)
      }
    }, typingSpeed)

    return () => {
      if (typingRef.current) clearInterval(typingRef.current)
    }
  }, [initialGreeting]) // Depend on initialGreeting prop

  // Effect to fetch suggested questions from API
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch("/api/suggested-questions")
        if (!response.ok) {
          throw new Error(`Failed to fetch suggested questions: ${response.statusText}`)
        }
        const data = await response.json()
        if (Array.isArray(data)) {
          setSuggestedQuestions(data)
        } else {
          console.error("API returned unexpected format for suggested questions:", data)
          setSuggestedQuestions([])
        }
      } catch (error) {
        console.error("Error fetching suggested questions:", error)
        setSuggestedQuestions([])
      }
    }

    fetchSuggestions()
  }, [])

  // Effect for cycling through suggested questions in input placeholder
  useEffect(() => {
    if (showSuggestionsInInput && !inputValue && suggestedQuestions.length > 0) {
      if (suggestionIntervalRef.current) clearInterval(suggestionIntervalRef.current) // Clear previous interval
      suggestionIntervalRef.current = setInterval(() => {
        setCurrentSuggestionIndex((prevIndex) => (prevIndex + 1) % suggestedQuestions.length)
      }, 5000)
    } else {
      if (suggestionIntervalRef.current) clearInterval(suggestionIntervalRef.current)
    }
    return () => {
      if (suggestionIntervalRef.current) clearInterval(suggestionIntervalRef.current)
    }
  }, [showSuggestionsInInput, inputValue, suggestedQuestions.length, suggestedQuestions])

  // Effect to scroll to the latest message
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
    setShowSuggestionsInInput(false)

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
      setShowSuggestionsInInput(true)
    }
  }

  const handleInputClick = () => {
    if (!inputValue && showSuggestionsInInput && !isLoading && !isTypingInitial && suggestedQuestions.length > 0) {
      setInputValue(suggestedQuestions[currentSuggestionIndex])
      if (suggestionIntervalRef.current) clearInterval(suggestionIntervalRef.current)
    }
  }

  const currentPlaceholder =
    showSuggestionsInInput && !isLoading && !isTypingInitial && !inputValue && suggestedQuestions.length > 0
      ? suggestedQuestions[currentSuggestionIndex]
      : "Ask me about WasLost.Ai or Michael..."

  return (
    <div className="w-full max-w-3xl mx-auto fade-in">
      <div className="jupiter-outer-panel p-6 mb-8">
        <div className="jupiter-panel p-4 flex flex-col gap-4 mb-6 max-h-[400px] overflow-y-auto">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} aiAvatarSrc={aiAvatarSrc} />
          ))}
          {isTypingInitial && (
            <div className="flex gap-3 p-4 rounded-lg bg-black/30 border border-border/40">
              <AiAvatar src={aiAvatarSrc} />
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
              <AiAvatar src={aiAvatarSrc} />
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
              if (suggestionIntervalRef.current) clearInterval(suggestionIntervalRef.current)
            }}
            onClick={handleInputClick}
            placeholder={currentPlaceholder}
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
