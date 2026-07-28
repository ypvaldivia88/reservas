import Link from "next/link";
import { cn } from "@/lib/utils";
import { PLATFORM_NAME } from "@/lib/platform-brand";

const sizeMap = {
  sm: { mark: 32, full: { w: 120, h: 32 } },
  md: { mark: 36, full: { w: 140, h: 36 } },
  lg: { mark: 44, full: { w: 160, h: 40 } },
} as const;

function LogoMark({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={PLATFORM_NAME}
    >
      <rect width="64" height="64" rx="16" fill="#1a9e8f" />
      <rect x="4" y="4" width="56" height="56" rx="14" fill="#22b8a5" />
      <rect
        x="16"
        y="18"
        width="32"
        height="30"
        rx="5"
        stroke="#f8fffe"
        strokeWidth="2.5"
      />
      <path
        stroke="#f8fffe"
        strokeWidth="2.5"
        strokeLinecap="round"
        d="M16 26h32"
      />
      <circle cx="24" cy="22" r="1.5" fill="#f8fffe" />
      <circle cx="32" cy="22" r="1.5" fill="#f8fffe" />
      <circle cx="40" cy="22" r="1.5" fill="#f8fffe" />
      <path
        stroke="#f8fffe"
        strokeWidth="2"
        strokeLinecap="round"
        d="M24 34h8M24 40h14"
      />
      <path fill="#fbbf24" d="m42 38 6 10 3-5 5-3-10-6-4 4z" />
    </svg>
  );
}

function LogoFull({
  width,
  height,
  className,
}: {
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={PLATFORM_NAME}
    >
      <rect width="32" height="32" rx="8" fill="#1a9e8f" />
      <rect x="2" y="2" width="28" height="28" rx="7" fill="#22b8a5" />
      <rect
        x="8"
        y="9"
        width="16"
        height="14"
        rx="3"
        stroke="#f8fffe"
        strokeWidth="1.5"
      />
      <path
        stroke="#f8fffe"
        strokeWidth="1.5"
        strokeLinecap="round"
        d="M8 13h16"
      />
      <path fill="#fbbf24" d="m21 17 3 5 1.5-2.5 2.5-1.5-5-3-2 2z" />
      <text
        x="40"
        y="22"
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        fontSize="15"
        fontWeight="700"
        fill="currentColor"
      >
        ReservaSalón
      </text>
    </svg>
  );
}

export interface PlatformLogoProps {
  variant?: "mark" | "full";
  size?: keyof typeof sizeMap;
  showWordmark?: boolean;
  href?: string;
  className?: string;
}

export default function PlatformLogo({
  variant = "mark",
  size = "md",
  showWordmark = false,
  href,
  className,
}: PlatformLogoProps) {
  const dims = sizeMap[size];
  const useFull = variant === "full" || showWordmark;

  const logo = useFull ? (
    <LogoFull
      width={dims.full.w}
      height={dims.full.h}
      className={className}
    />
  ) : (
    <LogoMark size={dims.mark} className={className} />
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex shrink-0 items-center transition-opacity hover:opacity-85"
        aria-label={PLATFORM_NAME}
      >
        {logo}
      </Link>
    );
  }

  return logo;
}
