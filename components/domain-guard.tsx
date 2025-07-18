"use client"

import type React from "react"

import { useDomainAuth } from "@/hooks/use-domain-auth"
import { W4UILanding } from "@/components/w4ui-landing"

interface DomainGuardProps {
  children: React.ReactNode
}

export function DomainGuard({ children }: DomainGuardProps) {
  const { isAuthorized, isLoading } = useDomainAuth()

  // Show loading state during SSR and initial client render
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show W4UI landing for unauthorized domains
  if (!isAuthorized) {
    return <W4UILanding />
  }

  // Show main app for authorized domains
  return <>{children}</>
}
