"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { CubeIcon, BookOpenIcon, CodeIcon } from "@/components/icons"

export function FeatureSection() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setVisible(true)
    }, 500)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
      <FeatureCard
        icon={<CubeIcon className="h-12 w-12 text-[#509f86] feature-icon" />}
        title="Advanced AI & Decentralized Application Engineering"
        delay={0}
        visible={visible}
      />
      <FeatureCard
        icon={<BookOpenIcon className="h-12 w-12 text-[#6eb075] feature-icon" />}
        title="Tokenization & Decentralization"
        delay={200}
        visible={visible}
      />
      <FeatureCard
        icon={<CodeIcon className="h-12 w-12 text-[#afcd4f] feature-icon" />}
        title="AI-Driven Trading & Strategy Automation"
        delay={400}
        visible={visible}
      />
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  delay,
  visible,
}: {
  icon: React.ReactNode
  title: string
  delay: number
  visible: boolean
}) {
  return (
    <div
      className={`neumorphic-base p-6 flex flex-col items-center text-center feature-card transition-all duration-700 ease-out ${
        visible ? "opacity-100 transform-none" : "opacity-0 translate-y-10"
      } hover:transform hover:translate-y-[-5px] transition-transform duration-300`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="mb-4 transition-transform duration-300">{icon}</div>
      <div className="subheading-regular">{title}</div>
    </div>
  )
}
