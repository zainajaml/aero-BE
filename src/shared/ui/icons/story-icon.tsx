import type { SVGProps } from "react";

export function StoryIcon({ ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M19 19V20.5C19 21.0523 18.5523 21.5 18 21.5H6.5C5.11929 21.5 4 20.3807 4 19C4 17.6193 5.11929 16.5 6.5 16.5H18C18.5523 16.5 19 16.9477 19 17.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 19V5C4 3.61929 5.11929 2.5 6.5 2.5H18C18.5523 2.5 19 2.94772 19 3.5V17.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
