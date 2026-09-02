import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * JobFinder Multi-Color Precision Vector Logo
 * - Multi-color distinct gradients:
 *   1. Briefcase Handle & Frame: Electric Cyan & Emerald (Career)
 *   2. Search Lens & Finder Handle: Vibrant Sky Blue & Indigo (Discovery)
 *   3. Opportunity Star: Radiant Sunburst Gold & Amber (Offer / Success)
 * - 100% Positive-layer vector geometry on transparent background
 * - No container box, zero text
 */
export const Logo: React.FC<LogoProps> = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="JobFinder Icon"
    >
      <defs>
        {/* 1. Briefcase Gradient (Teal / Emerald Cyan) */}
        <linearGradient id="jf-grad-briefcase" x1="8" y1="5" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        {/* 2. Search Lens Gradient (Electric Sky Blue / Royal Violet) */}
        <linearGradient id="jf-grad-lens" x1="14" y1="14" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>

        {/* 3. Opportunity Star Gradient (Sunburst Gold & Amber) */}
        <linearGradient id="jf-grad-star" x1="19" y1="19" x2="29" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="40%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* 4. Multi-color Ambient Glow */}
        <filter id="jf-multi-glow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#38BDF8" floodOpacity="0.3" />
        </filter>
      </defs>

      <g filter="url(#jf-multi-glow)">
        {/* 1. Briefcase Handle (Teal/Cyan) */}
        <path
          d="M16 11V8C16 6.34315 17.3431 5 19 5H25C26.6569 5 28 6.34315 28 8V11"
          stroke="url(#jf-grad-briefcase)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 2. Briefcase Outer Frame (Teal/Cyan) */}
        <path
          d="M8 18C8 14.134 11.134 11 15 11H29C32.866 11 36 14.134 36 18V20M8 20V29C8 32.866 11.134 36 15 36H16"
          stroke="url(#jf-grad-briefcase)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 3. Search Lens Circle (Sky Blue / Indigo) */}
        <circle
          cx="24"
          cy="24"
          r="8.5"
          stroke="url(#jf-grad-lens)"
          strokeWidth="3.5"
        />

        {/* 4. Magnifying Search Handle (Sky Blue / Indigo) */}
        <path
          d="M30 30L38.5 38.5"
          stroke="url(#jf-grad-lens)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* 5. Central Opportunity Star (Radiant Gold / Sunburst Amber) */}
        <path
          d="M24 19.5L25.3 22.7L28.5 24L25.3 25.3L24 28.5L22.7 25.3L19.5 24L22.7 22.7Z"
          fill="url(#jf-grad-star)"
        />

        {/* 6. Precision Spark Core */}
        <circle
          cx="24"
          cy="24"
          r="1.2"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  );
};
