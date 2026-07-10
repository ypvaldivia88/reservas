"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
export type ThemeTone = "soft" | "balanced" | "deep";

interface ThemeContextType {
  theme: Theme;
  darkTone: ThemeTone;
  lightTone: ThemeTone;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setDarkTone: (tone: ThemeTone) => void;
  setLightTone: (tone: ThemeTone) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyDarkTone(tone: ThemeTone) {
  document.documentElement.setAttribute("data-dark-tone", tone);
}

function applyLightTone(tone: ThemeTone) {
  document.documentElement.setAttribute("data-light-tone", tone);
}

function applyThemeClass(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function isValidTone(value: string | null): value is ThemeTone {
  return value === "soft" || value === "balanced" || value === "deep";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [darkTone, setDarkToneState] = useState<ThemeTone>("soft");
  const [lightTone, setLightToneState] = useState<ThemeTone>("soft");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const savedDarkTone = localStorage.getItem("darkTone");
    const savedLightTone = localStorage.getItem("lightTone");

    const initialTheme: Theme =
      savedTheme ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const initialDarkTone: ThemeTone = isValidTone(savedDarkTone) ? savedDarkTone : "soft";
    const initialLightTone: ThemeTone = isValidTone(savedLightTone) ? savedLightTone : "soft";

    setThemeState(initialTheme);
    setDarkToneState(initialDarkTone);
    setLightToneState(initialLightTone);
    applyThemeClass(initialTheme);
    applyDarkTone(initialDarkTone);
    applyLightTone(initialLightTone);
  }, []);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    localStorage.setItem("theme", nextTheme);
    applyThemeClass(nextTheme);
  };

  const toggleTheme = () => {
    setThemeState((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      applyThemeClass(newTheme);
      return newTheme;
    });
  };

  const setDarkTone = (tone: ThemeTone) => {
    setDarkToneState(tone);
    localStorage.setItem("darkTone", tone);
    applyDarkTone(tone);
  };

  const setLightTone = (tone: ThemeTone) => {
    setLightToneState(tone);
    localStorage.setItem("lightTone", tone);
    applyLightTone(tone);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        darkTone,
        lightTone,
        toggleTheme,
        setTheme,
        setDarkTone,
        setLightTone,
      }}
    >
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

// Backward-compatible alias
export type DarkTone = ThemeTone;
