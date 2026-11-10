"use client";

import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={theme === "night"}
      aria-label="Night theme"
      className="theme-toggle"
    >
      {theme === "light" ? "Night" : "Day"}
    </button>
  );
}
