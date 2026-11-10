"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "night";
type ThemeContextValue = { theme: Theme; toggleTheme: () => void };

const storageKey = "safeearth-theme";
const changeEvent = "safeearth-theme-change";
const ThemeContext = createContext<ThemeContextValue | null>(null);
let memoryTheme: Theme = "light";

function getSnapshot(): Theme {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "light" || saved === "night") return saved;
  } catch {
    // Keep the toggle usable when browser storage is unavailable.
  }
  return memoryTheme;
}

function getServerSnapshot(): Theme {
  return "light";
}

function subscribe(onChange: () => void) {
  window.addEventListener(changeEvent, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(changeEvent, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function toggleTheme() {
  memoryTheme = getSnapshot() === "light" ? "night" : "light";
  try {
    window.localStorage.setItem(storageKey, memoryTheme);
  } catch {
    // The in-memory preference still works for the current visit.
  }
  document.documentElement.dataset.theme = memoryTheme;
  window.dispatchEvent(new Event(changeEvent));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
