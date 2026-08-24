"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "mkt-ai-theme";
const CHANGE_EVENT = "mkt-ai-theme-change";

type ThemeContextValue = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemePreference) {
  const dark = theme === "dark" || (
    theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    (notify) => {
      window.addEventListener("storage", notify);
      window.addEventListener(CHANGE_EVENT, notify);
      return () => {
        window.removeEventListener("storage", notify);
        window.removeEventListener(CHANGE_EVENT, notify);
      };
    },
    () => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : "system";
    },
    () => "system" as ThemePreference,
  );

  useEffect(() => applyTheme(theme), [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") applyTheme("system");
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [theme]);

  function setTheme(nextTheme: ThemePreference) {
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme deve ser usado dentro de ThemeProvider.");
  return context;
}
