"use client";

import React from "react";

export type StickieMood = "wave" | "mail" | "sleepy" | "think" | "cheer" | "oops";

interface StickieProps {
  mood?: StickieMood;
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export function Stickie({
  mood = "wave",
  size = 120,
  className = "",
  ariaLabel,
}: StickieProps) {
  const label = ariaLabel || `Stickie mascot showing ${mood} expression`;

  return (
    <div
      role="img"
      aria-label={label}
      style={{ width: size, height: size }}
      className={`inline-block select-none transition-transform duration-200 ${className}`}
    >
      <svg
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        {/* Ledge (Duolingo 3D bottom ledge) */}
        <path
          d="M 22 24 C 22 17.37 27.37 12 34 12 L 106 12 C 112.63 12 118 17.37 118 24 L 118 96 L 90 124 L 34 124 C 27.37 124 22 118.63 22 112 Z"
          transform="translate(0, 5)"
          className="fill-sun-ledge"
        />

        {/* Note Body (Sun Fill) */}
        <path
          d="M 22 24 C 22 17.37 27.37 12 34 12 L 106 12 C 112.63 12 118 17.37 118 24 L 118 96 L 90 124 L 34 124 C 27.37 124 22 118.63 22 112 Z"
          className="fill-sun"
        />

        {/* Folded Corner (Bottom-Right) */}
        <path
          d="M 118 96 L 90 96 C 90 96 90 124 90 124 Z"
          className="fill-sun-ledge"
          opacity="0.85"
        />
        <path
          d="M 118 96 L 90 96 L 90 124 Z"
          fill="none"
          stroke="var(--sun-ledge)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Blush Cheeks */}
        <ellipse cx="44" cy="74" rx="5" ry="3" fill="#D92B63" opacity="0.22" />
        <ellipse cx="88" cy="74" rx="5" ry="3" fill="#D92B63" opacity="0.22" />

        {/* Mood-Specific Face and Accessories */}
        {mood === "wave" && (
          <g>
            {/* Happy eyes */}
            <circle cx="48" cy="62" r="5" className="fill-ink" />
            <circle cx="84" cy="62" r="5" className="fill-ink" />
            <circle cx="50" cy="60" r="1.5" fill="#FFFFFF" />
            <circle cx="86" cy="60" r="1.5" fill="#FFFFFF" />
            {/* Sweet smile */}
            <path
              d="M 58 72 Q 66 82 74 72"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Waving hand */}
            <path
              d="M 112 48 Q 126 34 124 24 Q 118 20 114 30 L 108 42"
              className="fill-sun stroke-sun-ledge"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </g>
        )}

        {mood === "cheer" && (
          <g>
            {/* Joyful arched eyes */}
            <path
              d="M 42 62 Q 48 54 54 62"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M 78 62 Q 84 54 90 62"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Open happy mouth */}
            <path
              d="M 56 68 Q 66 84 76 68 Z"
              className="fill-ink"
            />
            <path
              d="M 60 76 Q 66 82 72 76"
              fill="#D92B63"
            />
            {/* Cheerful hands up */}
            <path
              d="M 24 50 Q 14 34 18 26 Q 26 26 28 38 L 30 54"
              className="fill-sun stroke-sun-ledge"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="M 112 50 Q 122 34 118 26 Q 110 26 108 38 L 106 54"
              className="fill-sun stroke-sun-ledge"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* Sparkle burst */}
            <path d="M 66 22 L 67 27 L 72 28 L 67 29 L 66 34 L 65 29 L 60 28 L 65 27 Z" fill="#FF7B2E" />
          </g>
        )}

        {mood === "mail" && (
          <g>
            {/* Friendly eyes */}
            <circle cx="48" cy="56" r="5" className="fill-ink" />
            <circle cx="84" cy="56" r="5" className="fill-ink" />
            <circle cx="50" cy="54" r="1.5" fill="#FFFFFF" />
            <circle cx="86" cy="54" r="1.5" fill="#FFFFFF" />
            {/* Smile */}
            <path
              d="M 60 64 Q 66 70 72 64"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Mail envelope held in front */}
            <rect
              x="42"
              y="74"
              width="48"
              height="32"
              rx="4"
              fill="#FFFFFF"
              stroke="var(--ink-2)"
              strokeWidth="2"
            />
            <path
              d="M 44 76 L 66 92 L 88 76"
              fill="none"
              stroke="var(--ink-2)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="66" cy="92" r="3" fill="#D92B63" />
          </g>
        )}

        {mood === "sleepy" && (
          <g>
            {/* Closed resting curved eyes */}
            <path
              d="M 44 64 Q 50 68 56 64"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 76 64 Q 82 68 88 64"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Calm little mouth */}
            <ellipse cx="66" cy="74" rx="3.5" ry="2" className="fill-ink" />
            {/* Floating zzz */}
            <text
              x="96"
              y="42"
              fill="var(--ink-2)"
              fontSize="14"
              fontWeight="900"
              fontFamily="var(--font-display), sans-serif"
            >
              z
            </text>
            <text
              x="108"
              y="32"
              fill="var(--ink-2)"
              fontSize="11"
              fontWeight="900"
              fontFamily="var(--font-display), sans-serif"
            >
              z
            </text>
          </g>
        )}

        {mood === "think" && (
          <g>
            {/* Looking up thoughtfully */}
            <circle cx="50" cy="58" r="5" className="fill-ink" />
            <circle cx="86" cy="58" r="5" className="fill-ink" />
            <circle cx="52" cy="55" r="1.5" fill="#FFFFFF" />
            <circle cx="88" cy="55" r="1.5" fill="#FFFFFF" />
            {/* Thinking slight sideways mouth */}
            <path
              d="M 62 74 Q 68 76 74 72"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Hand on chin */}
            <circle cx="76" cy="82" r="7" className="fill-sun stroke-sun-ledge" strokeWidth="2.5" />
          </g>
        )}

        {mood === "oops" && (
          <g>
            {/* Worried round open eyes */}
            <ellipse cx="48" cy="60" rx="6" ry="7" className="fill-ink" />
            <ellipse cx="84" cy="60" rx="6" ry="7" className="fill-ink" />
            <circle cx="50" cy="58" r="2" fill="#FFFFFF" />
            <circle cx="86" cy="58" r="2" fill="#FFFFFF" />
            {/* Wavy nervous mouth */}
            <path
              d="M 56 76 Q 61 72 66 76 Q 71 80 76 76"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Tiny drop of sweat */}
            <path
              d="M 98 46 C 98 42 102 36 102 36 C 102 36 106 42 106 46 C 106 48.2 104.2 50 102 50 C 99.8 50 98 48.2 98 46 Z"
              fill="#FF7B2E"
            />
          </g>
        )}
      </svg>
    </div>
  );
}

