import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge" // Correctly imported Badge
import { cn } from "@/lib/utils" // Ensure cn is imported

interface ProjectCardProps {
  title: string
  description: string
  status: string
  lastUpdated: string
  className?: string
}

export function ProjectCard({ title, description, status, lastUpdated, className }: ProjectCardProps) {
  return (
    <Card className={cn("jupiter-card p-4", className)}>
      <CardHeader className="p-0 pb-2">
        <CardTitle className="text-xl font-syne font-semibold text-primary">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0 text-sm">
        <div className="flex justify-between items-center text-caption">
          <span className="text-muted-foreground">
            Status:{" "}
            <Badge variant="secondary" className="bg-gray-700 text-gray-200">
              {status}
            </Badge>
          </span>
          <span className="text-muted-foreground">
            Last Updated: <span className="text-foreground">{lastUpdated}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
