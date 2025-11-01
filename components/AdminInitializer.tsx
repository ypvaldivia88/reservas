"use client";
import { useEffect } from "react";

export default function AdminInitializer() {
  useEffect(() => {
    // Initialize admin user on app load
    const initAdmin = async () => {
      try {
        await fetch("/api/auth/init", { method: "POST" });
      } catch (error) {
        console.error("Error initializing admin:", error);
      }
    };

    initAdmin();
  }, []);

  return null; // This component doesn't render anything
}
