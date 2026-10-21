import React from 'react';

interface SupariLogoProps {
  size?: number;
  className?: string;
}

export const SupariLogo: React.FC<SupariLogoProps> = ({ size = 88, className = '' }) => {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <defs>
        {/* Drop shadow */}
        <radialGradient id="supariAppShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.35)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>

        {/* Supari Body (Realistic Orange-Golden-Brown Betel Nut) */}
        <radialGradient id="supariAppBody" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="50%" stopColor="#ea580c" />
          <stop offset="85%" stopColor="#9a3412" />
          <stop offset="100%" stopColor="#431407" />
        </radialGradient>

        {/* Calyx & Stem Green */}
        <linearGradient id="supariAppCalyx" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#65a30d" />
          <stop offset="100%" stopColor="#3f6212" />
        </linearGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx="60" cy="100" rx="35" ry="12" fill="url(#supariAppShadow)" />

      {/* Nut Body */}
      <path
        d="M 60 25 C 95 25, 100 60, 85 88 C 75 105, 45 105, 35 88 C 20 60, 25 25, 60 25 Z"
        fill="url(#supariAppBody)"
      />

      {/* Natural Supari Crease Textures */}
      <path
        d="M 40 40 Q 32 65 42 90"
        stroke="#7c2d12"
        strokeWidth="2.5"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />
      <path
        d="M 80 40 Q 88 65 78 90"
        stroke="#7c2d12"
        strokeWidth="2.5"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />
      <path
        d="M 60 98 Q 65 70 60 30"
        stroke="#7c2d12"
        strokeWidth="1.5"
        fill="none"
        opacity="0.3"
      />
      <path
        d="M 50 35 Q 45 60 52 95"
        stroke="#7c2d12"
        strokeWidth="1.5"
        fill="none"
        opacity="0.25"
      />
      <path
        d="M 70 35 Q 75 60 68 95"
        stroke="#7c2d12"
        strokeWidth="1.5"
        fill="none"
        opacity="0.25"
      />

      {/* Glossy Light Reflection */}
      <ellipse
        cx="45"
        cy="45"
        rx="8"
        ry="18"
        fill="#ffedd5"
        opacity="0.28"
        transform="rotate(-20 45 45)"
      />

      {/* Calyx Cap */}
      <path
        d="M 45 28 C 48 20, 55 18, 60 18 C 65 18, 72 20, 75 28 C 78 32, 68 32, 60 34 C 52 32, 42 32, 45 28 Z"
        fill="url(#supariAppCalyx)"
      />
      <path
        d="M 40 25 C 45 25, 48 30, 52 28 C 48 35, 40 32, 40 25 Z"
        fill="url(#supariAppCalyx)"
      />
      <path
        d="M 80 25 C 75 25, 72 30, 68 28 C 72 35, 80 32, 80 25 Z"
        fill="url(#supariAppCalyx)"
      />

      {/* Stem */}
      <rect x="57" y="14" width="6" height="8" fill="#3f6212" rx="2" />
    </svg>
  );
};
