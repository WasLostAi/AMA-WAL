import { GradientHeading } from "@/components/gradient-heading"
import { ProjectCard } from "@/components/project-card"

export default function ProjectsPage() {
  const projects = [
    {
      title: "AI Chatbot Integration",
      description: "Integrating advanced AI models for conversational interfaces and automated support.",
      status: "Active Development",
      lastUpdated: "2025-06-20",
    },
    {
      title: "Content Syndication Engine",
      description: "Automating content distribution across multiple social media platforms and blogs.",
      status: "Beta Testing",
      lastUpdated: "2025-06-18",
    },
    {
      title: "SEO Optimization Suite",
      description: "Tools for generating meta descriptions, keywords, and analyzing content for search engine ranking.",
      status: "Feature Freeze",
      lastUpdated: "2025-06-15",
    },
    {
      title: "Solana Wallet Connector",
      description: "Developing secure and seamless integration with Solana blockchain wallets for dApp interactions.",
      status: "Under Review",
      lastUpdated: "2025-06-10",
    },
  ]

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-background text-foreground">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <GradientHeading text="Project Repository" className="mb-12" />

        <div className="jupiter-panel p-6 rounded-xl shadow-inner-neumorphic">
          <h2 className="subheading-large text-center mb-8 text-primary">Current Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project, index) => (
              <ProjectCard
                key={index}
                title={project.title}
                description={project.description}
                status={project.status}
                lastUpdated={project.lastUpdated}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
