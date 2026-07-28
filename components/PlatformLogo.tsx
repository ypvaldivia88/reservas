import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PLATFORM_LOGO, PLATFORM_NAME } from "@/lib/platform-brand";

const sizeMap = {
  sm: { mark: 28, full: { w: 100, h: 28 } },
  md: { mark: 36, full: { w: 140, h: 36 } },
  lg: { mark: 44, full: { w: 180, h: 44 } },
} as const;

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
  const src = useFull ? PLATFORM_LOGO.small : PLATFORM_LOGO.mark;
  const width = useFull ? dims.full.w : dims.mark;
  const height = useFull ? dims.full.h : dims.mark;

  const image = (
    <Image
      src={src}
      alt={PLATFORM_NAME}
      width={width}
      height={height}
      className={cn("shrink-0", className)}
      priority
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-85"
        aria-label={PLATFORM_NAME}
      >
        {image}
      </Link>
    );
  }

  return image;
}
