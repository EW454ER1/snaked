import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6,18c0-3.9,3.1-7,7-7s7,3.1,7,7" />
      <path d="M18,6c0,3.9-3.1,7-7,7S4,9.9,4,6" />
      <circle cx="6" cy="6" r="1" />
    </svg>
  );
}
