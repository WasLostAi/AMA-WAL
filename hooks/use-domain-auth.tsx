"use client"

import { useState, useEffect } from "react"

export function useDomainAuth() {
  const [isAuthorized, setIsAuthorized] = useState(true) // Default to true for SSR
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkDomain = () => {
      if (typeof window === "undefined") return

      const hostname = window.location.hostname
      const authorizedDomains = ["waslost.tech", "www.waslost.tech", "localhost", "127.0.0.1"]

      const authorized = authorizedDomains.includes(hostname)
      setIsAuthorized(authorized)
      setIsLoading(false)
    }

    checkDomain()
  }, [])

  return { isAuthorized, isLoading }
}
