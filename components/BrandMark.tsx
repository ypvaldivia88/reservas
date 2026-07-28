import Image from "next/image";
import { cn } from "@/lib/utils";

export interface BrandMarkProps {
  name: string;
  logoUrl?: string | null;
  primaryColor?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "size-8 text-xs rounded-lg",
  md: "size-9 sm:size-10 text-sm rounded-xl",
  lg: "size-12 text-base rounded-xl",
} as const;

const imageSizes = {
  sm: 32,
  md: 40,
  lg: 48,
} as const;

/** Avatar de marca: logo del tenant o inicial sobre color de marca. */
export default function BrandMark({
  name,
  logoUrl,
  primaryColor,
  size = "md",
  className,
}: BrandMarkProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const px = imageSizes[size];

  if (logoUrl) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden shadow-sm",
          sizeClasses[size],
          className
        )}
      >
        <Image
          src={logoUrl}
          alt={`Logo de ${name}`}
          width={px}
          height={px}
          className="size-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center font-bold text-white shadow-sm",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: primaryColor ?? "var(--primary)" }}
      aria-hidden
    >
      {initial}
    </div>
  );
}
