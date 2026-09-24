"use client";

import { useEffect } from "react";

export function ThemeInitializer() {
  useEffect(() => {
    const saved = localStorage.getItem("waslix-theme");
    const isSavedTheme = saved === "dark" || saved === "light";
    const isDark = isSavedTheme
      ? saved === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = isDark ? "dark" : "light";

    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = theme;
    document.cookie = `waslix-theme=${theme}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  return null;
}
