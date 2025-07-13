"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Rocket,
  Target,
  Users,
  DollarSign,
  Palette,
  Zap,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react"

interface SetupStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}

interface UseCase {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  recommendedMode: string
}

const SETUP_STEPS: SetupStep[] = [
  {
    id: "use-case",
    title: "Define Your Use Case",
    description: "Tell us what you want to achieve",
    icon: <Target className="h-5 w-5" />,
  },
  {
    id: "audience",
    title: "Identify Your Audience",
    description: "Who are you trying to reach?",
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: "monetization",
    title: "Monetization Strategy",
    description: "How do you plan to generate revenue?",
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    id: "customization",
    title: "Customize Your Setup",
    description: "Fine-tune your configuration",
    icon: <Palette className="h-5 w-5" />,
  },
  {
    id: "launch",
    title: "Launch Your Site",
    description: "Deploy your adaptive frontend",
    icon: <Rocket className="h-5 w-5" />,
  },
]

const USE_CASES: UseCase[] = [
  {
    id: "portfolio",
    title: "Professional Portfolio",
    description: "Showcase your work and skills",
    icon: <Users className="h-5 w-5" />,
    recommendedMode: "traditional-portfolio",
  },
  {
    id: "business",
    title: "Business Website",
    description: "Promote your services and generate leads",
    icon: <Target className="h-5 w-5" />,
    recommendedMode: "hybrid-commerce",
  },
  {
    id: "ecommerce",
    title: "Online Store",
    description: "Sell products or services online",
    icon: <DollarSign className="h-5 w-5" />,
    recommendedMode: "traditional-ecommerce",
  },
  {
    id: "ai-agent",
    title: "AI Agent Platform",
    description: "Deploy intelligent AI interactions",
    icon: <Zap className="h-5 w-5" />,
    recommendedMode: "monetized-agent",
  },
]

export function SmartSetup() {
  const [currentStep, setCurrentStep] = useState(0)
  const [setupData, setSetupData] = useState({
    useCase: "",
    audience: "",
    monetization: "",
    customization: {},
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const progress = ((currentStep + 1) / SETUP_STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < SETUP_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleUseCaseSelect = (useCaseId: string) => {
    setSetupData({ ...setupData, useCase: useCaseId })
  }

  const handleLaunch = async () => {
    setIsGenerating(true)
    // Simulate setup process
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setIsGenerating(false)
    // Trigger mode activation
    const selectedUseCase = USE_CASES.find((uc) => uc.id === setupData.useCase)
    if (selectedUseCase) {
      // This would trigger the mode change in the parent component
      console.log("Launching with mode:", selectedUseCase.recommendedMode)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-[#afcd4f] mb-2">What's your primary goal?</h3>
              <p className="text-white/70">Choose the option that best describes what you want to achieve</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {USE_CASES.map((useCase) => (
                <Card
                  key={useCase.id}
                  className={`neumorphic-base cursor-pointer transition-all duration-200 ${
                    setupData.useCase === useCase.id ? "ring-2 ring-[#afcd4f]" : ""
                  }`}
                  onClick={() => handleUseCaseSelect(useCase.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-neumorphic-inset text-[#afcd4f]">{useCase.icon}</div>
                      <div>
                        <h4 className="font-semibold text-white">{useCase.title}</h4>
                        <Badge variant="outline" className="text-xs text-[#afcd4f] border-[#afcd4f]">
                          {useCase.recommendedMode.replace("-", " ")}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-white/70 text-sm">{useCase.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-[#afcd4f] mb-2">Who is your target audience?</h3>
              <p className="text-white/70">Understanding your audience helps us optimize your frontend</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="audience-type">Primary Audience</Label>
                <Select
                  value={setupData.audience}
                  onValueChange={(value) => setSetupData({ ...setupData, audience: value })}
                >
                  <SelectTrigger className="bg-neumorphic-base">
                    <SelectValue placeholder="Select your primary audience" />
                  </SelectTrigger>
                  <SelectContent className="bg-neumorphic-base">
                    <SelectItem value="developers">Developers & Tech Professionals</SelectItem>
                    <SelectItem value="businesses">Business Owners & Entrepreneurs</SelectItem>
                    <SelectItem value="consumers">General Consumers</SelectItem>
                    <SelectItem value="investors">Investors & VCs</SelectItem>
                    <SelectItem value="students">Students & Learners</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="audience-description">Audience Description</Label>
                <Textarea
                  id="audience-description"
                  placeholder="Describe your target audience in more detail..."
                  className="bg-neumorphic-base"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-[#afcd4f] mb-2">How do you plan to monetize?</h3>
              <p className="text-white/70">This helps us configure the right features for your business model</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="monetization-model">Revenue Model</Label>
                <Select
                  value={setupData.monetization}
                  onValueChange={(value) => setSetupData({ ...setupData, monetization: value })}
                >
                  <SelectTrigger className="bg-neumorphic-base">
                    <SelectValue placeholder="Select your revenue model" />
                  </SelectTrigger>
                  <SelectContent className="bg-neumorphic-base">
                    <SelectItem value="services">Service-based (Consulting, Freelancing)</SelectItem>
                    <SelectItem value="products">Product Sales (Physical/Digital)</SelectItem>
                    <SelectItem value="subscription">Subscription/SaaS</SelectItem>
                    <SelectItem value="advertising">Advertising & Sponsorships</SelectItem>
                    <SelectItem value="affiliate">Affiliate Marketing</SelectItem>
                    <SelectItem value="none">No monetization (Portfolio/Personal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-[#afcd4f] mb-2">Customize Your Setup</h3>
              <p className="text-white/70">Fine-tune your configuration based on your preferences</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="brand-name">Brand/Business Name</Label>
                <Input id="brand-name" placeholder="Enter your brand name" className="bg-neumorphic-base" />
              </div>
              <div>
                <Label htmlFor="primary-color">Primary Brand Color</Label>
                <div className="flex gap-2">
                  <Input id="primary-color" type="color" defaultValue="#afcd4f" className="bg-neumorphic-base w-20" />
                  <Input placeholder="#afcd4f" className="bg-neumorphic-base flex-1" />
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-[#afcd4f] mb-2">Ready to Launch!</h3>
              <p className="text-white/70">Your adaptive frontend is ready to be deployed</p>
            </div>
            <div className="bg-neumorphic-inset p-6 rounded-lg">
              <h4 className="font-semibold text-white mb-4">Setup Summary:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Use Case:</span>
                  <span className="text-[#afcd4f]">
                    {USE_CASES.find((uc) => uc.id === setupData.useCase)?.title || "Not selected"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Recommended Mode:</span>
                  <span className="text-[#afcd4f]">
                    {USE_CASES.find((uc) => uc.id === setupData.useCase)?.recommendedMode.replace("-", " ") ||
                      "Not selected"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Target Audience:</span>
                  <span className="text-[#afcd4f]">{setupData.audience || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Monetization:</span>
                  <span className="text-[#afcd4f]">{setupData.monetization || "Not specified"}</span>
                </div>
              </div>
            </div>
            {isGenerating ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#afcd4f] animate-spin" />
                  <span className="text-white">Generating your adaptive frontend...</span>
                </div>
                <Progress value={75} className="w-full" />
              </div>
            ) : (
              <Button onClick={handleLaunch} className="jupiter-button-dark w-full" disabled={!setupData.useCase}>
                <Rocket className="h-4 w-4 mr-2" />
                Launch My Adaptive Frontend
              </Button>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#afcd4f] mb-2">Smart Setup Wizard</h2>
        <p className="text-white/70">Let's configure your adaptive frontend in just a few steps</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-white/70">
            Step {currentStep + 1} of {SETUP_STEPS.length}
          </span>
          <span className="text-sm text-[#afcd4f]">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-4">
          {SETUP_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4">
              <div
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  index === currentStep
                    ? "bg-neumorphic-base ring-2 ring-[#afcd4f]"
                    : index < currentStep
                      ? "bg-neumorphic-inset"
                      : "bg-neumorphic-base opacity-50"
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="h-5 w-5 text-[#afcd4f]" />
                ) : (
                  <div className={`${index === currentStep ? "text-[#afcd4f]" : "text-white/50"}`}>{step.icon}</div>
                )}
                <div className="hidden md:block">
                  <h4
                    className={`font-semibold text-sm ${index === currentStep ? "text-[#afcd4f]" : index < currentStep ? "text-white" : "text-white/50"}`}
                  >
                    {step.title}
                  </h4>
                  <p
                    className={`text-xs ${index === currentStep ? "text-white/70" : index < currentStep ? "text-white/60" : "text-white/30"}`}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
              {index < SETUP_STEPS.length - 1 && <ArrowRight className="h-4 w-4 text-white/30 hidden md:block" />}
            </div>
          ))}
        </div>
      </div>

      <Card className="neumorphic-base">
        <CardContent className="p-6">{renderStepContent()}</CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          variant="outline"
          className="jupiter-button-dark bg-transparent"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button
          onClick={handleNext}
          disabled={currentStep === SETUP_STEPS.length - 1 || (currentStep === 0 && !setupData.useCase)}
          className="jupiter-button-dark"
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
