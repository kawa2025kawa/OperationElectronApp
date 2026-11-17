// src/renderer/styles/tokens/theme.css.ts

import { createTheme } from "@vanilla-extract/css";
import { tokens } from "./semantic.contract.js";

/* ============================================================
 * Common Tokens
 * ============================================================ */

const commonValues = {
  font: {
    base: "'Inter', 'Noto Sans JP', sans-serif",
    mono: "'JetBrains Mono', monospace",

    size: {
      xs: "0.75rem",
      sm: "0.875rem",
      md: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
    },

    fluid: {
      sm: "clamp(12px, 1.8vmin, 14px)",
      md: "clamp(16px, 2.2vmin, 20px)",
      lg: "clamp(20px, 3.5vmin, 28px)",
    },

    weight: {
      normal: "500",
      medium: "700",
      bold: "900",
    },
  },

  space: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
  },

  size: {
    controlHeight: "40px",
    tableRowHeight: "56px",
    tableHeaderGroupHeight: "64px",
    badgeWidth: "120px",
  },

  radius: {
    sm: "6px",
    md: "10px",
    lg: "16px",
    full: "9999px",
  },

  transition: {
    fast: "0.18s cubic-bezier(0.4, 0, 0.2, 1)",
    normal: "0.8s cubic-bezier(0.25, 0.8, 0.25, 1)",
    ease: "0.3s ease-out",
    glow: "0.8s cubic-bezier(0.25, 0.8, 0.25, 1)",
  },

  zIndex: {
    base: "0",
    under: "1",
    active: "2",
    content: "10",
    sticky: "100",
    dropdown: "200",
    contextMenu: "500",
    overlay: "900",
    modal: "1000",
    toast: "1100",
    tooltip: "1200",
    globalOverlay: "1300",
  },
} as const;

/* ============================================================
 * Status Colors, Tints & Glow
 * ============================================================ */

const darkStatusColors = {
  total: "rgba(255, 255, 255, 1)",
  success: "rgba(74, 222, 128, 1)",
  running: "rgba(250, 204, 21, 1)",
  needsAction: "rgba(255, 136, 0, 1)",
  ready: "rgba(226, 53, 140, 1)",
  waiting: "rgba(96, 165, 250, 1)",
  scheduled: "rgba(148, 163, 184, 1)",
  error: "rgba(248, 113, 113, 1)",
} as const;

const darkStatusTints = {
  success: "rgba(74, 222, 128, 0.1)",
  warning: "rgba(250, 204, 21, 0.1)",
  error: "rgba(248, 113, 113, 0.1)",
} as const;

const darkStatusGlow = {
  total: "0 0 12px rgba(255, 255, 255, 0.5)",
  error: "0 0 12px rgba(255, 80, 80, 0.5)",
  success: "0 0 12px rgba(74, 222, 128, 0.5)",
  needsAction: "0 0 14px rgba(255, 115, 0, 0.8)",
  running: "0 0 12px rgba(250, 204, 21, 0.5)",
  ready: "0 0 12px rgba(226, 53, 140, 0.5)",
  waiting: "0 0 12px rgba(96, 165, 250, 0.5)",
  scheduled: "0 0 12px rgba(148, 163, 184, 0.5)",
} as const;

/* ============================================================
 * Dark Theme
 * ============================================================ */

const darkRaised = {
  low: "3px 3px 6px rgba(0, 0, 0, 0.5), -2px -2px 6px rgba(255, 255, 255, 0.08)",
  md: "5px 5px 10px rgba(0, 0, 0, 0.6), -3px -3px 8px rgba(255, 255, 255, 0.1)",
  high: "8px 8px 16px rgba(0, 0, 0, 0.8), -5px -5px 12px rgba(255, 255, 255, 0.12)",
} as const;

const darkGlowCyan = "0 0 10px rgba(0, 220, 255, 0.6)";

export const darkThemeClass = createTheme(
  tokens,
  {
    ...commonValues,

    color: {
      bg: {
        base: "rgba(30, 34, 39, 1)",
        header: "rgba(20, 20, 25, 0.8)",
        frostedGlass: "rgba(255, 255, 255, 0.1)",
      },

      text: {
        base: "rgba(161, 162, 164, 1)",
        hover: "rgba(235, 235, 235, 1)",
        onAccent: "rgba(255, 255, 255, 1)",
      },

      border: {
        default: "rgba(255, 255, 255, 0.08)",
        subtle: "rgba(0, 0, 0, 0.6)",
        accent: "rgba(0, 200, 180, 1)",
        highlight: "rgba(255, 255, 255, 0.08)",
      },

      accent: {
        base: "rgba(0, 200, 180, 1)",
        hover: "rgba(0, 180, 160, 1)",
        neonCyan: "rgba(0, 220, 255, 1)",
        neonPink: "rgba(255, 60, 200, 1)",
        neonWhite: "rgba(255, 255, 255, 1)",
      },

      status: darkStatusColors,
      statusTint: darkStatusTints,

      calendar: {
        saturday: "#3b9eff",
        holiday: "#ff4d4f",
      },
    },

    glass: {
      surface: "rgba(20, 20, 25, 0.6)",
      surfaceSubtle: "rgba(0, 0, 0, 0.28)",
      border: "rgba(255, 255, 255, 0.08)",
      borderStrong: "rgba(255, 255, 255, 0.14)",
      blur: "18px",
      blurStrong: "28px",
      saturation: "140%",

      contextMenu: {
        surface: "rgba(18, 20, 24, 0.1)",
        border: "#000000",
        blur: "20px",
        saturation: "180%",
      },
    },

    gradient: {
      brand:
        "linear-gradient(90deg, rgba(12, 235, 235, 1), rgba(32, 227, 178, 1), rgba(41, 255, 198, 1))",
    },

    shadow: {
      highlight:
        "inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.12)",

      contextMenu:
        "0 0 0 1px rgba(0, 0, 0, 0.8), 0 12px 36px rgba(0, 0, 0, 0.7), 0 4px 12px rgba(0, 0, 0, 0.5)",

      raised: darkRaised,

      pressed: {
        low: "inset 3px 3px 6px rgba(0, 0, 0, 0.6), inset -2px -2px 6px rgba(255, 255, 255, 0.08)",
        md: "inset 5px 5px 10px rgba(0, 0, 0, 0.8), inset -3px -3px 8px rgba(255, 255, 255, 0.1)",
        high: "inset 10px 10px 20px rgba(0, 0, 0, 0.9), inset -8px -8px 16px rgba(255, 255, 255, 0.05)",
      },

      glow: {
        brand: "0 0 12px rgba(0, 200, 180, 0.5)",
        cyan: darkGlowCyan,
        white: "0 0 14px rgba(255, 255, 255, 0.8)",
        ...darkStatusGlow,
      },

      glowRaised: {
        md: `${darkGlowCyan}, ${darkRaised.md}`,
        high: `${darkGlowCyan}, ${darkRaised.high}`,
      },
    },
  },
  "theme-dark",
);