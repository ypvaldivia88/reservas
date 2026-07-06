"use client";
import { usePathname } from "next/navigation";
import Header from "./Header";
import PlatformHeader from "./PlatformHeader";

const PLATFORM_PATHS = ["/", "/registro"];
const RESERVED_PATHS = ["/", "/reserva", "/registro"];

export default function AppHeader() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const isSlugRoute =
    pathname &&
    !RESERVED_PATHS.includes(pathname) &&
    /^\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathname);

  if (isSlugRoute) {
    return null;
  }

  if (pathname && PLATFORM_PATHS.includes(pathname)) {
    return <PlatformHeader />;
  }

  const isHomePage = pathname === "/";

  return <Header isHomePage={isHomePage} />;
}
