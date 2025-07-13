"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Github, Mail, Phone, MapPin } from "lucide-react"
import type { ModeConfig } from "@/lib/mode-manager"
import Image from "next/image"

interface TraditionalPortfolioProps {
  config: ModeConfig
}

interface Project {
  id: string
  title: string
  description: string
  image: string
  technologies: string[]
  liveUrl?: string
  githubUrl?: string
  featured: boolean
}

interface Skill {
  name: string
  level: number
  category: string
}

// Mock data - in real implementation, this would come from the content management system
const SAMPLE_PROJECTS: Project[] = [
  {
    id: "1",
    title: "WasLost.Ai Platform",
    description: "Revolutionary adaptive AI platform with dynamic frontend modes and advanced content management.",
    image: "/placeholder.svg?height=300&width=400",
    technologies: ["Next.js", "TypeScript", "OpenAI", "Supabase", "Tailwind CSS"],
    liveUrl: "https://waslost.ai",
    githubUrl: "https://github.com/waslost/platform",
    featured: true,
  },
  {
    id: "2",
    title: "Blockchain Trading Bot",
    description: "Automated trading system for Solana-based tokens with advanced risk management.",
    image: "/placeholder.svg?height=300&width=400",
    technologies: ["Python", "Solana", "Web3.js", "React", "PostgreSQL"],
    githubUrl: "https://github.com/waslost/trading-bot",
    featured: true,
  },
  {
    id: "3",
    title: "AI Content Generator",
    description: "Multi-platform content generation system with SEO optimization and social media integration.",
    image: "/placeholder.svg?height=300&width=400",
    technologies: ["Node.js", "OpenAI", "MongoDB", "Express", "Vue.js"],
    liveUrl: "https://content-gen.waslost.ai",
    featured: true,
  },
]

const SAMPLE_SKILLS: Skill[] = [
  { name: "JavaScript/TypeScript", level: 95, category: "Frontend" },
  { name: "React/Next.js", level: 90, category: "Frontend" },
  { name: "Node.js", level: 88, category: "Backend" },
  { name: "Python", level: 85, category: "Backend" },
  { name: "AI/ML Integration", level: 92, category: "AI" },
  { name: "Blockchain/Web3", level: 80, category: "Blockchain" },
  { name: "Database Design", level: 87, category: "Backend" },
  { name: "UI/UX Design", level: 75, category: "Design" },
]

export default function TraditionalPortfolio({ config }: TraditionalPortfolioProps) {
  const featuredProjects = SAMPLE_PROJECTS.filter((p) => p.featured)
  const skillCategories = Array.from(new Set(SAMPLE_SKILLS.map((s) => s.category)))

  return (
    <div className="min-h-screen bg-[#0C0C0C]">
      {/* Header */}
      <header className="neumorphic-base border-b border-border/20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden neumorphic-inset">
                <Image
                  src="/placeholder.svg?height=128&width=128"
                  alt="Profile"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
              <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#afcd4f] text-black">
                Available
              </Badge>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-white mb-2 font-syne">Michael P. Robinson</h1>
              <p className="text-xl text-[#afcd4f] mb-4">AI Engineer & Full-Stack Developer</p>
              <p className="text-white/80 max-w-2xl leading-relaxed">
                Passionate about building intelligent systems that solve real-world problems. Specializing in AI
                integration, blockchain technology, and scalable web applications.
              </p>
              <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
                <Button className="jupiter-button-dark">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Me
                </Button>
                <Button
                  variant="outline"
                  className="border-[#afcd4f] text-[#afcd4f] hover:bg-[#afcd4f] hover:text-black bg-transparent"
                >
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        {/* Featured Projects */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#afcd4f] mb-4 font-syne">Featured Projects</h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              A showcase of my recent work in AI, blockchain, and web development
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProjects.map((project) => (
              <Card
                key={project.id}
                className="neumorphic-base hover:bg-neumorphic-light/50 transition-all duration-300 group"
              >
                <CardHeader className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <Image
                      src={project.image || "/placeholder.svg"}
                      alt={project.title}
                      width={400}
                      height={250}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.slice(0, 3).map((tech) => (
                          <Badge key={tech} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <CardTitle className="text-xl text-white mb-3 font-syne">{project.title}</CardTitle>
                  <p className="text-white/70 mb-4 leading-relaxed">{project.description}</p>
                  <div className="flex gap-3">
                    {project.liveUrl && (
                      <Button size="sm" className="jupiter-button-dark">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Live Demo
                      </Button>
                    )}
                    {project.githubUrl && (
                      <Button size="sm" variant="outline" className="border-[#afcd4f] text-[#afcd4f] bg-transparent">
                        <Github className="h-4 w-4 mr-2" />
                        Code
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#afcd4f] mb-4 font-syne">Technical Skills</h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Expertise across the full technology stack with focus on modern frameworks and AI integration
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {skillCategories.map((category) => (
              <Card key={category} className="neumorphic-base">
                <CardHeader>
                  <CardTitle className="text-lg text-[#afcd4f] font-syne">{category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {SAMPLE_SKILLS.filter((skill) => skill.category === category).map((skill) => (
                    <div key={skill.name}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white text-sm">{skill.name}</span>
                        <span className="text-[#afcd4f] text-sm font-semibold">{skill.level}%</span>
                      </div>
                      <div className="w-full bg-neumorphic-base rounded-full h-2 shadow-inner">
                        <div
                          className="bg-gradient-to-r from-[#afcd4f] to-[#2ed3b7] h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#afcd4f] mb-4 font-syne">Get In Touch</h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Ready to collaborate on your next project? Let's discuss how we can work together.
            </p>
          </div>
          <Card className="neumorphic-base max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-neumorphic-base">
                      <Mail className="h-5 w-5 text-[#afcd4f]" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Email</p>
                      <p className="text-white/70 text-sm">michael@waslost.ai</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-neumorphic-base">
                      <Phone className="h-5 w-5 text-[#afcd4f]" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Phone</p>
                      <p className="text-white/70 text-sm">Available upon request</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-neumorphic-base">
                      <MapPin className="h-5 w-5 text-[#afcd4f]" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Location</p>
                      <p className="text-white/70 text-sm">Remote / Global</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <Button className="w-full jupiter-button-dark bg-[#afcd4f] text-black hover:bg-[#afcd4f]/90">
                    Schedule a Call
                  </Button>
                  <Button variant="outline" className="w-full border-[#afcd4f] text-[#afcd4f] bg-transparent">
                    Download Resume
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    View LinkedIn
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="neumorphic-base border-t border-border/20 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center">
          <p className="text-white/60">
            © 2025 Michael P. Robinson. Built with Next.js, TypeScript, and AI-powered tools.
          </p>
        </div>
      </footer>
    </div>
  )
}
