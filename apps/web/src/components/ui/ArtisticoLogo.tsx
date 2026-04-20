"use client";

import React from "react";
import Link from "next/link";
import clsx from "clsx";
import styles from "./ArtisticoLogo.module.css";

/**
 * ArtisticoLogo
 * Renders the Artistico brand logo with rainbow brushstroke and tagline.
 * Used in Header (upper-left) and Footer only.
 *
 * Props:
 * - size: 'small' | 'medium' | 'large' (default: 'medium')
 * - animated: boolean (default: true)
 * - className: string (optional)
 */
export interface ArtisticoLogoProps {
  size?: "small" | "medium" | "large";
  animated?: boolean;
  showTagline?: boolean;
  className?: string;
}

const heightMap: Record<string, number> = {
  small: 48,
  medium: 80,
  large: 140,
};

export const ArtisticoLogo: React.FC<ArtisticoLogoProps> = ({
  size = "medium",
  animated = true,
  showTagline = true,
  className,
}) => {
  const height = heightMap[size] ?? heightMap.medium;

  return (
    <Link
      href="/"
      aria-label="Artistico home"
      className={clsx(styles.logoLink, className)}
    >
      {/* ── Logo SVG ── */}
      <svg
        viewBox="0 0 380 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ height, width: "auto", display: "block" }}
        className={clsx(animated && styles.animated)}
      >
        <defs>
          <linearGradient id="brush-grad" x1="0" y1="0" x2="340" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff2020" />
            <stop offset="16%" stopColor="#ff8800" />
            <stop offset="33%" stopColor="#ffe600" />
            <stop offset="50%" stopColor="#22cc22" />
            <stop offset="67%" stopColor="#2288ff" />
            <stop offset="83%" stopColor="#6644cc" />
            <stop offset="100%" stopColor="#9933cc" />
            {animated && (
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                values="0 0;60 0;0 0"
                dur="8s"
                repeatCount="indefinite"
              />
            )}
          </linearGradient>
          <filter id="brush-glow" x="-10%" y="-40%" width="120%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d="M15 50 Q60 20 120 42 Q200 68 260 38 Q310 18 360 48"
          fill="none"
          stroke="url(#brush-grad)"
          strokeWidth="28"
          strokeLinecap="round"
          filter="url(#brush-glow)"
          opacity="0.85"
        />

        <text
          x="18"
          y="78"
          fontSize="72"
          fontFamily="var(--font-playfair), 'Playfair Display', 'Georgia', serif"
          fontStyle="italic"
          fontWeight="700"
          fill="#111111"
        >
          Artistico
        </text>

        <desc>Artistico logo with rainbow gradient brushstroke.</desc>
      </svg>

      {/* ── Tagline (shown by default in header/footer) ── */}
      {showTagline && (
        <span className={styles.tagline}>
        <span className={styles.tagRed}>...</span>
        <span className={styles.tagOrange}>for the </span>
        <span className={styles.tagGreen}>love </span>
        <span className={styles.tagBlue}>of </span>
        <span className={styles.tagPurple}>creating!</span>
      </span>
      )}
    </Link>
  );
};

export default ArtisticoLogo;
