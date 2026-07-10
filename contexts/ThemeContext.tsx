"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
export type DarkTone = "soft" | "balanced" | "deep";

interface ThemeContextType {
  theme: Theme;
  darkTone: DarkTone;
  toggleTheme: () => void;
  setDarkTone: (tone: DarkTone) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyDarkTone(tone: DarkTone) {
  document.documentElement.setAttribute("data-dark-tone", tone);
}

function applyThemeClass(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [darkTone, setDarkToneState] = useState<DarkTone>("soft");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const savedTone = localStorage.getItem("darkTone") as DarkTone | null;

    const initialTheme: Theme =
      savedTheme ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const initialTone: DarkTone =
      savedTone === "balanced" || savedTone === "deep" ? savedTone : "soft";

    setTheme(initialTheme);
    setDarkToneState(initialTone);
    applyThemeClass(initialTheme);
    applyDarkTone(initialTone);
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      applyThemeClass(newTheme);
      return newTheme;
    });
  };

  const setDarkTone = (tone: DarkTone) => {
    setDarkToneState(tone);
    localStorage.setItem("darkTone", tone);
    applyDarkTone(tone);
  };

  return (
    <ThemeContext.Provider value={{ theme, darkTone, toggleTheme, setDarkTone }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
