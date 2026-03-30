import Link from "next/link";
import DifficultyBadge from "./DifficultyBadge";

interface ProjectCardProps {
  project: {
    projectId: string;
    title: string;
    slug: string;
    description: string;
    images: string[];
    category: string;
    difficulty?: "beginner" | "intermediate" | "advanced" | null;
    productCount: number;
    averageRating: number;
    reviewCount: number;
    savesCount?: number;
  };
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm hover:shadow-md transition-all"
    >
      {/* Image */}
      <div className="aspect-[4/3] bg-muted">
        {project.images?.[0] && (
          <img
            src={project.images[0]}
            alt={project.title}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
          {project.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </p>
        <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
          <span className="rounded-full bg-accent/50 px-2 py-0.5">
            {project.category}
          </span>
          <DifficultyBadge difficulty={project.difficulty} />
          {project.productCount > 0 && (
            <span>{project.productCount} products</span>
          )}
          {project.averageRating > 0 && (
            <span>★ {project.averageRating.toFixed(1)}</span>
          )}
          {(project.savesCount ?? 0) > 0 && (
            <span>♡ {project.savesCount}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
