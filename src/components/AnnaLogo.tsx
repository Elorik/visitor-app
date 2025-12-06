// src/components/AnnaLogo.tsx
import type { SVGProps } from "react";

export function AnnaLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 150 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ANNA restaurant"
      {...props}
    >
      <defs>
        <linearGradient
          id="anna-logo-gradient"
          x1="0"
          y1="0"
          x2="150"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#F4D48A" />
          <stop offset="0.5" stopColor="#D5AF6E" />
          <stop offset="1" stopColor="#997241" />
        </linearGradient>
      </defs>

      {/* емблема */}
      <circle
        cx="22"
        cy="20"
        r="11.5"
        stroke="url(#anna-logo-gradient)"
        strokeWidth="1.5"
        opacity="0.9"
      />
      <circle
        cx="22"
        cy="20"
        r="6.5"
        fill="url(#anna-logo-gradient)"
        opacity="0.9"
      />

      {/* підкреслення */}
      <path
        d="M10 30 C 22 34, 40 36, 70 32"
        stroke="rgba(213,175,110,0.7)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* ANNA */}
      <text
        x="52"
        y="23"
        fill="url(#anna-logo-gradient)"
        fontSize="18"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        letterSpacing="0.38em"
      >
        ANNA
      </text>

      {/* RESTAURANT */}
      <text
        x="53"
        y="32"
        fill="#B39A70"
        fontSize="8"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        letterSpacing="0.18em"
      >
        RESTAURANT
      </text>
    </svg>
  );
}
