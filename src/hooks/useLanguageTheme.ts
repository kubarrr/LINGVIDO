"use client";

import { useEffect } from "react";
import { LANGUAGE_THEMES } from "@/lib/constants";

/**
 * Applies the colour scheme for a given language to the document root by
 * setting CSS custom properties. Colours stay until another page sets them,
 * so navigation between themed pages doesn't flicker back to a default.
 */
export function useLanguageTheme(languageCode: string | undefined) {
  useEffect(() => {
    if (!languageCode) return;
    const theme = LANGUAGE_THEMES[languageCode] ?? LANGUAGE_THEMES.en;
    const root = document.documentElement;

    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--ring", theme.primary);
    root.style.setProperty("--lang-from", theme.from);
    root.style.setProperty("--lang-to", theme.to);
    root.style.setProperty("--lang-glow", theme.glow);
  }, [languageCode]);
}
