"use client";
import { usePathname } from "next/navigation";
import Header from "./Header";

export default function AppHeader() {
  const pathname = usePathname();
  
  // Don't show header on admin routes (they have their own header)
  if (pathname?.startsWith("/admin")) {
    return null;
  }
  
  // Determine if we're on home page
  const isHomePage = pathname === "/";
  
  return <Header isHomePage={isHomePage} />;
}
