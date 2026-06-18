"use client";

import type { SVGProps } from "react";

type ZoodBrandLogoProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

export default function ZoodBrandLogo({
  title = "水煮油条君",
  ...props
}: ZoodBrandLogoProps) {
  return (
    <svg
      viewBox="0 0 860 190"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>{title}</title>
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth="13"
        transform="translate(16 12)"
      >
        <path d="M7 4 173 37 106 169Z" />
        <path d="M7 4 91 75 173 37" />
        <path d="M91 75 106 169" />
        <path d="M91 75 153 61 106 169" />
        <path d="M36 31 91 75 74 157" />
      </g>

      <text
        aria-hidden="true"
        x="244"
        y="128"
        fill="currentColor"
        fontFamily="'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', 'Heiti SC', sans-serif"
        fontSize="84"
        fontWeight="900"
        letterSpacing="10"
      >
        水煮油条君
      </text>
    </svg>
  );
}
