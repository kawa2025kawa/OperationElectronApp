// src/renderer/styles/tokens/theme.css.ts

import { createTheme, style } from "@vanilla-extract/css";
import { tokens } from "./semantic.contract.js";

/* =========================
   共通トークン・基本設定
========================= */
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

  radius: {
    sm: "6px",
    md: "10px",
    lg: "16px",
    full: "9999px",
  },

  transition: {
    fast: "0.1s ease",
    normal: "0.25s ease",
    ease: "0.3s ease-out",
  },

  zIndex: {
    base: "0",
    under: "1", // 背面レイヤー
    active: "2", // アクティブな要素
    content: "10",
    sticky: "100",
    dropdown: "200",
    overlay: "900",
    modal: "1000",
    toast: "1100",
    tooltip: "1200",
    globalOverlay: "1300",
  },
};

/* =========================
   基本アニメーション設定
========================= */
export const themeTransition = style({
  transition: `
    background-color ${commonValues.transition.normal},
    color ${commonValues.transition.normal},
    border-color ${commonValues.transition.normal},
    box-shadow ${commonValues.transition.normal}
  `.replace(/\n/g, ""),
});

/* =========================
   ダークテーマ設定 (Dark Theme)
========================= */
export const darkThemeClass = createTheme(
  tokens,
  {
    ...commonValues,

    color: {
      bg: {
        base: "rgba(30, 34, 39, 1)", // メイン背景
        surface: "rgba(28, 28, 40, 1)", // 表面（カードなど）
        inset: "rgba(16, 16, 22, 1)", // 凹み（インセット）
        header: "rgba(20, 20, 25, 0.8)", // ヘッダー
      },

      text: {
        base: "rgba(161, 162, 164, 1)",
        hover: "rgba(235, 235, 235, 1)",
        onAccent: "rgba(255, 255, 255, 1)",
      },

      border: {
        default: "rgba(255, 255, 255, 0.08)",
        subtle: "rgba(255, 255, 255, 0.03)",
        accent: "rgba(0, 200, 180, 1)",
      },

      accent: {
        base: "rgba(0, 200, 180, 1)",
        hover: "rgba(0, 180, 160, 1)",

        neonCyan: "rgba(0, 220, 255, 1)",
        neonPink: "rgba(255, 60, 200, 1)",
      },

      /* ステータスカラー (RGBA 形式) */
      status: {
        total: "rgba(255, 255, 255, 1)",
        success: "rgba(74, 222, 128, 1)",
        running: "rgba(250, 204, 21, 1)",
        ready: "rgba(226, 53, 140, 1)",
        waiting: "rgba(96, 165, 250, 1)",
        scheduled: "rgba(148, 163, 184, 1)",
        error: "rgba(248, 113, 113, 1)",
      },
    },

    /* グラデーション設定 */
    gradient: {
      brand:
        "linear-gradient(90deg, rgba(12, 235, 235, 1), rgba(32, 227, 178, 1), rgba(41, 255, 198, 1))",
    },

    shadow: {
      raised: {
        low: "3px 3px 6px rgba(0,0,0,0.5), -2px -2px 6px rgba(255,255,255,0.08)",
        md: "5px 5px 10px rgba(0,0,0,0.6), -3px -3px 8px rgba(255,255,255,0.1)",
        high: "8px 8px 16px rgba(0,0,0,0.8), -5px -5px 12px rgba(255,255,255,0.12)",
      },

      pressed: {
        low: "inset 3px 3px 6px rgba(0,0,0,0.6), inset -2px -2px 6px rgba(255,255,255,0.08)",
        md: "inset 5px 5px 10px rgba(0,0,0,0.8), inset -3px -3px 8px rgba(255,255,255,0.1)",
        high: "inset 10px 10px 20px rgba(0,0,0,0.9), inset -8px -8px 16px rgba(255,255,255,0.05)",
      },

      glow: {
        brand: "0 0 12px rgba(0,200,180,0.5)",
        cyan: "0 0 15px rgba(0,220,255,0.6)",
        total: "0 0 12px rgba(255, 255, 255, 0.5)",
        error: "0 0 12px rgba(255,80,80,0.5)",
        success: "0 0 12px rgba(74, 222, 128, 0.5)",
        running: "0 0 12px rgba(250, 204, 21, 0.5)",
        ready: "0 0 12px rgba(226, 53, 140, 0.5)",
        waiting: "0 0 12px rgba(96, 165, 250, 0.5)",
        scheduled: "0 0 12px rgba(148, 163, 184, 0.5)",
      },
    },
  },
  "theme-dark",
);

/* =========================
   ライトテーマ設定 (Light Theme)
========================= */
export const lightThemeClass = createTheme(
  tokens,
  {
    ...commonValues,

    color: {
      bg: {
        base: "rgba(236, 240, 243, 1)",
        surface: "rgba(242, 245, 248, 1)",
        inset: "rgba(225, 230, 235, 1)",
        header: "rgba(242, 245, 248, 0.8)",
      },

      text: {
        base: "rgb(121, 125, 129)",
        hover: "rgba(45, 45, 45, 0.9)",
        onAccent: "rgba(255, 255, 255, 1)",
      },

      border: {
        default: "rgba(0, 0, 0, 0.08)",
        subtle: "rgba(0, 0, 0, 0.03)",
        accent: "rgba(0, 200, 180, 1)",
      },

      accent: {
        base: "rgba(0, 200, 180, 1)",
        hover: "rgba(0, 180, 160, 1)",

        neonCyan: "rgba(0, 200, 255, 1)",
        neonPink: "rgba(255, 60, 200, 1)",
      },

      status: {
        total: "rgba(60, 64, 67, 1)",
        success: "rgba(34, 197, 94, 1)",
        running: "rgba(234, 179, 8, 1)",
        ready: "rgba(236, 72, 153, 1)",
        waiting: "rgba(59, 130, 246, 1)",
        scheduled: "rgba(100, 116, 139, 1)",
        error: "rgba(239, 68, 68, 1)",
      },
    },

    gradient: {
      brand:
        "linear-gradient(135deg, rgba(0, 242, 254, 1) 0%, rgb(47, 156, 252) 100%)",
    },

    shadow: {
      raised: {
        low: "3px 3px 6px rgba(0, 0, 0, 0.15), -2px -2px 6px rgba(255, 255, 255, 0.8)",
        md: "5px 5px 10px rgba(0, 0, 0, 0.2), -4px -4px 8px rgba(255, 255, 255, 0.9)",
        high: "8px 8px 16px rgba(0, 0, 0, 0.35), -6px -6px 12px rgba(255, 255, 255, 1)",
      },

      pressed: {
        low: "inset 3px 3px 6px rgba(0, 0, 0, 0.15), inset -2px -2px 6px rgba(255, 255, 255, 0.8)",
        md: "inset 5px 5px 10px rgba(0, 0, 0, 0.2), inset -4px -4px 8px rgba(255, 255, 255, 0.9)",
        high: "inset 10px 10px 20px rgba(0, 0, 0, 0.35), inset -8px -8px 16px rgba(255, 255, 255, 1)",
      },

      glow: {
        brand: "0 0 10px rgba(0, 200, 180, 0.4)",
        cyan: "0 0 12px rgba(0, 200, 255, 0.4)",
        total: "0 0 10px rgba(60, 64, 67, 0.4)",
        error: "0 0 10px rgba(255, 80, 80, 0.4)",
        success: "0 0 10px rgba(34, 197, 94, 0.4)",
        running: "0 0 10px rgba(234, 179, 8, 0.4)",
        ready: "0 0 10px rgba(236, 72, 153, 0.4)",
        waiting: "0 0 10px rgba(59, 130, 246, 0.4)",
        scheduled: "0 0 10px rgba(100, 116, 139, 0.4)",
      },
    },
  },
  "theme-light",
);
