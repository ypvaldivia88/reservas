import { ImageResponse } from "next/og";
import { PLATFORM_BRAND } from "@/lib/platform-brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
          background: `linear-gradient(135deg, ${PLATFORM_BRAND.primary} 0%, ${PLATFORM_BRAND.primaryLight} 100%)`,
        }}
      >
        <svg
          width="100"
          height="100"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="16" y="18" width="32" height="30" rx="5" stroke="#f8fffe" strokeWidth="2.5" />
          <path stroke="#f8fffe" strokeWidth="2.5" strokeLinecap="round" d="M16 26h32" />
          <circle cx="24" cy="22" r="1.5" fill="#f8fffe" />
          <circle cx="32" cy="22" r="1.5" fill="#f8fffe" />
          <circle cx="40" cy="22" r="1.5" fill="#f8fffe" />
          <path stroke="#f8fffe" strokeWidth="2" strokeLinecap="round" d="M24 34h8M24 40h14" />
          <path fill="#fbbf24" d="m42 38 6 10 3-5 5-3-10-6-4 4z" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
