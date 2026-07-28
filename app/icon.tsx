import { ImageResponse } from "next/og";
import { PLATFORM_BRAND } from "@/lib/platform-brand";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background: `linear-gradient(135deg, ${PLATFORM_BRAND.primary} 0%, ${PLATFORM_BRAND.primaryLight} 100%)`,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="4" y="5" width="16" height="15" rx="2.5" stroke="white" strokeWidth="2" />
          <path d="M4 9h16" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <circle cx="8" cy="7" r="1" fill="white" />
          <circle cx="12" cy="7" r="1" fill="white" />
          <circle cx="16" cy="7" r="1" fill="white" />
          <path
            d="M8 13h5M8 16h8"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
