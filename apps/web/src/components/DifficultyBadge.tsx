interface DifficultyBadgeProps {
  difficulty: "beginner" | "intermediate" | "advanced" | null | undefined;
}

const DIFFICULTY_CONFIG = {
  beginner: { label: "Beginner", className: "bg-green-100 text-green-800" },
  intermediate: { label: "Intermediate", className: "bg-amber-100 text-amber-800" },
  advanced: { label: "Advanced", className: "bg-red-100 text-red-800" },
};

export default function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  if (!difficulty) return null;

  const config = DIFFICULTY_CONFIG[difficulty];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
