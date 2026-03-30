interface ArtisticoLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: { width: 140, height: 40, fontSize: 26, strokeWidth: 14 },
  md: { width: 200, height: 56, fontSize: 36, strokeWidth: 18 },
  lg: { width: 340, height: 90, fontSize: 60, strokeWidth: 28 },
} as const;

export function ArtisticoLogo({ size = "md", className }: ArtisticoLogoProps) {
  const { width, height, fontSize, strokeWidth } = sizeConfig[size];
  const cy = height * 0.58;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Artistico"
      className={className}
    >
      <defs>
        <linearGradient id={`rainbow-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff0000" />
          <stop offset="16%" stopColor="#ff8c00" />
          <stop offset="33%" stopColor="#ffd600" />
          <stop offset="50%" stopColor="#00c853" />
          <stop offset="66%" stopColor="#2979ff" />
          <stop offset="83%" stopColor="#651fff" />
          <stop offset="100%" stopColor="#d500f9" />
        </linearGradient>
      </defs>

      {/* Brush stroke behind text */}
      <path
        d={`M ${width * 0.03} ${cy + 1}
            C ${width * 0.12} ${cy - strokeWidth * 0.6},
              ${width * 0.28} ${cy + strokeWidth * 0.5},
              ${width * 0.45} ${cy - strokeWidth * 0.15}
            S ${width * 0.72} ${cy + strokeWidth * 0.45},
              ${width * 0.97} ${cy - strokeWidth * 0.1}`}
        stroke={`url(#rainbow-${size})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={0.85}
      />

      {/* Logo text */}
      <text
        x={width / 2}
        y={cy + fontSize * 0.02}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-playfair), 'Playfair Display', Georgia, 'Times New Roman', serif"
        fontSize={fontSize}
        fontWeight={700}
        fontStyle="italic"
        fill="#1c1917"
        letterSpacing="-0.02em"
      >
        Artistico
      </text>
    </svg>
  );
}
