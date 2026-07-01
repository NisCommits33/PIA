import { cn } from "@/lib/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("block", className)}
      fill="none"
      viewBox="0 0 128 128"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="128" height="128" rx="28" fill="#0f172a" />
      <path
        d="M64 14 77.5 42.5 109 30 96.5 61 114 88 82.5 84.5 64 112 45.5 84.5 14 88 31.5 61 19 30 50.5 42.5 64 14Z"
        fill="#dc2626"
      />
      <path
        d="M64 26 73.6 48.7 98 40.3 88.2 63.5 101 84.8 76.4 80.8 64 101.5 51.6 80.8 27 84.8 39.8 63.5 30 40.3 54.4 48.7 64 26Z"
        fill="#f59e0b"
      />
      <circle cx="64" cy="64" r="29" fill="#111827" stroke="#fde68a" strokeWidth="4" />
      <path
        d="M64 34C74 47.5 80 56.5 80 67.4 80 77.5 73 85 64 85S48 77.5 48 67.4C48 56.5 54 47.5 64 34Z"
        fill="#f97316"
      />
      <path
        d="M64.7 50.5C70.1 58.3 73 63.8 73 69.7 73 75.5 69.1 79.8 64 79.8S55 75.5 55 69.7C55 63.8 58.7 58.1 64.7 50.5Z"
        fill="#fde68a"
      />
      <path
        d="M47 88H81M52 96H76"
        stroke="#f8fafc"
        strokeLinecap="round"
        strokeWidth="5"
      />
    </svg>
  );
}
