"use client";

import { useEffect } from "react";
import { LANGUAGE_THEMES } from "@/lib/constants";

/**
 * Repaints the whole UI in the colours of the given language (background,
 * text, cards, borders and accents — all drawn from the country's flag).
 * Works by overriding the shadcn/Tailwind design tokens on :root at runtime.
 * Colours persist until another page sets them, so navigation doesn't flicker.
 */
export function useLanguageTheme(languageCode: string | undefined) {
  useEffect(() => {
    if (!languageCode) return;
    const t = LANGUAGE_THEMES[languageCode] ?? LANGUAGE_THEMES.en;
    const root = document.documentElement;

    const vars: Record<string, string> = {
      "--background": t.background,
      "--foreground": t.foreground,
      "--card": t.card,
      "--card-foreground": t.cardForeground,
      "--popover": t.card,
      "--popover-foreground": t.cardForeground,
      "--secondary": t.secondary,
      "--secondary-foreground": t.secondaryForeground,
      "--muted": t.muted,
      "--muted-foreground": t.mutedForeground,
      "--accent": t.accent,
      "--accent-foreground": t.foreground,
      "--border": t.border,
      "--input": t.secondary,
      "--primary": t.primary,
      "--primary-foreground": t.primaryForeground,
      "--ring": t.primary,
      "--glass-bg": t.glassBg,
      "--glass-border": t.glassBorder,
      "--lang-from": t.from,
      "--lang-to": t.to,
      "--lang-glow": t.glow,
    };

    for (const [k, v] of Object.entries(vars)) {
      root.style.setProperty(k, v);
    }
    // Make native form controls (selects, scrollbars) match the theme.
    root.style.colorScheme = t.mode;
  }, [languageCode]);
}
