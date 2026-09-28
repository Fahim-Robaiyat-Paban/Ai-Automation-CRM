"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

// Inlined into <head> so the correct theme class is set before paint —
// avoids a light->dark flash on load. Reads the same key the provider writes.
export const THEME_BOOT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("signalboard-theme");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.classList.toggle("light", theme === "light");
  } catch (e) {}
})();
`;

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem("signalboard-theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    } else {
      setTheme(
        window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark"
      );
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    window.localStorage.setItem("signalboard-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
