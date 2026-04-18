import React from "react";
import Link from "next/link";
import clsx from "clsx";
import styles from "./ArtisticoLogo.module.css";
import heights from "./ArtisticoLogo.heights.css";

/**
 * ArtisticoLogo
 * Renders the animated SVG logo with tagline.
 * Props:
 * - size: 'small' | 'medium' | 'large' (default: 'medium')
 * - animated: boolean (default: true)
 * - className: string (optional)
 */
export interface ArtisticoLogoProps {
  size?: "small" | "medium" | "large";
  animated?: boolean;
  className?: string;
}

const sizeMap = {
  small: 64,
  medium: 120,
  large: 200,
};

export const ArtisticoLogo: React.FC<ArtisticoLogoProps> = ({
  size = "medium",
  animated = true,
  className,
}) => {
  // Responsive height, max-height, preserve aspect ratio
  const height = sizeMap[size];
  return (
    <Link
      href="/"
      aria-label="Artistico home"
      className={clsx(styles.logoLink, className)}
    >
      <span
        className={clsx(styles.logoSpan, heights[`h${height}`])}
      >
        <svg
          viewBox="0 0 900 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className={clsx(
            styles.logoSvg,
            animated && styles.animated,
            heights[`h${height}`]
          )}
        >
          <defs>
            <linearGradient id="logo-gradient" x1="0" y1="0" x2="900" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff4d4d">
                {animated && (
                  <animate attributeName="offset" values="0;1;0" dur="8s" repeatCount="indefinite" />
                )}
              </stop>
              <stop offset="20%" stopColor="#ffb347" />
              <stop offset="40%" stopColor="#6aff4d" />
              <stop offset="60%" stopColor="#4dcfff" />
              <stop offset="80%" stopColor="#6a5acd" />
              <stop offset="100%" stopColor="#a259c4" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Brush stroke under Artistico (vector path) */}
          <path d="M30 80 Q120 30 250 70 Q400 120 480 60 Q600 10 800 80" fill="none" stroke="url(#logo-gradient)" strokeWidth="22" strokeLinecap="round" filter="url(#glow)" />
          {/* Artistico (vector path, italic style) - placeholder for now */}
          <text x="60" y="110" fontSize="64" fontFamily="Playfair Display, serif" fontStyle="italic" fill="#111" fontWeight="500">
            Artistico
          </text>
          {/* Tagline: ...for the love of creating! (script-like, gradient fill) */}
          <text x="320" y="150" fontSize="38" fontFamily="cursive, Arial, sans-serif" fill="url(#logo-gradient)">
            ...for the love of creating!
            {animated && (
              <animate attributeName="x" values="320;340;320" dur="8s" repeatCount="indefinite" />
            )}
          </text>
          <desc>Artistico ...for the love of creating! logo, with a colorful animated gradient brush stroke and script tagline.</desc>
        </svg>
      </span>
      <style jsx>{`
        .artistico-logo-animated {
          filter: drop-shadow(0 2px 8px rgba(120, 80, 180, 0.12));
          transition: filter 0.2s, box-shadow 0.2s;
        }
        .artistico-logo-animated:hover {
          filter: drop-shadow(0 4px 16px rgba(120, 80, 180, 0.25)) brightness(1.08);
        }
        @media (prefers-reduced-motion: reduce) {
          .artistico-logo-animated animate {
            display: none !important;
          }
        }
      `}</style>
    </Link>
  );
};

export default ArtisticoLogo;
