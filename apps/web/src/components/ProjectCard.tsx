"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DifficultyBadge from "./DifficultyBadge";
import SaveButton from "./SaveButton";
import LikeButton from "./LikeButton";
import { formatCurrency } from "@/lib/utils";

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
    likeCount?: number;
    totalSalesCount?: number;
    minPrice?: number | null;
    creatorName?: string;
    creatorAvatar?: string | null;
    videoThumbnailUrl?: string;
    clipUrl?: string;
    clipStatus?: "processing" | "ready";
  };
  isLive?: boolean;
  isLiked?: boolean;
}

export default function ProjectCard({ project, isLive = false, isLiked = false }: ProjectCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 hover:scale-[1.02]">
      {/* Action overlays (save + like) */}
      <div
        className="absolute top-2 right-2 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 sm:transition-opacity"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <LikeButton
          projectId={project.projectId}
          initialCount={project.likeCount ?? 0}
          initialLiked={isLiked}
        />
        <SaveButton
          projectId={project.projectId}
          initialCount={project.savesCount ?? 0}
        />
      </div>

      <Link href={`/projects/${project.slug}`}>
        {/* Image */}
        <div className="aspect-[3/2] overflow-hidden bg-muted rounded-t-2xl relative">
          {project.images?.[0] || project.videoThumbnailUrl ? (
            <Image
              src={project.videoThumbnailUrl ?? project.images[0]}
              alt={project.title}
              width={600}
              height={400}
              onLoad={() => setImgLoaded(true)}
              className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">
              🎨
            </div>
          )}

          {/* LIVE badge */}
          {isLive && (
            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              LIVE
            </div>
          )}

          {/* Clip badge */}
          {!isLive && project.clipStatus === "ready" && project.clipUrl && (
            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-purple-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
              ✂ Clip
            </div>
          )}

          {/* Video indicator (only if no live/clip badge) */}
          {!isLive && project.clipStatus !== "ready" && project.videoThumbnailUrl && (
            <div className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="white"
                className="h-3.5 w-3.5 translate-x-0.5"
              >
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            </div>
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

          {/* Creator attribution */}
          {project.creatorName && (
            <div className="mt-2 flex items-center gap-2">
              {project.creatorAvatar ? (
                <Image
                  src={project.creatorAvatar}
                  alt={project.creatorName}
                  width={20}
                  height={20}
                  className="rounded-full object-cover"
                />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {project.creatorName[0]?.toUpperCase()}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {project.creatorName}
              </span>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <span className="rounded-full bg-accent/50 px-2 py-0.5">
              {project.category}
            </span>
            <DifficultyBadge difficulty={project.difficulty} />
            {project.minPrice != null && project.minPrice > 0 && (
              <span className="font-semibold text-foreground">
                From {formatCurrency(project.minPrice)}
              </span>
            )}
            {project.averageRating > 0 && (
              <span aria-label={`${project.averageRating.toFixed(1)} stars`}>
                ★ {project.averageRating.toFixed(1)}
              </span>
            )}
            {(project.likeCount ?? 0) > 0 && (
              <span aria-label={`${project.likeCount} likes`}>
                ♥ {project.likeCount}
              </span>
            )}
            {(project.savesCount ?? 0) > 0 && (
              <span aria-label={`${project.savesCount} saves`}>
                ♡ {project.savesCount}
              </span>
            )}
            {(project.totalSalesCount ?? 0) > 0 && (
              <span className="font-medium text-primary" aria-label={`${project.totalSalesCount} sold`}>
                🔥 {project.totalSalesCount} sold
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
