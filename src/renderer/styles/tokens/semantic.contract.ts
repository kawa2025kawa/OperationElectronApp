// src/renderer/styles/tokens/semantic.contract.ts

import { createGlobalThemeContract } from "@vanilla-extract/css";

export const tokens = createGlobalThemeContract(
  {
    /* ==========================================================
     * Color
     * ========================================================== */

    color: {
      bg: {
        /** アプリ全体のベース背景 */
        base: null,

        /** Header / navigation 系 */
        header: null,

        /** ハイライト・ホバー用のすりガラス調背景 */
        frostedGlass: null,
      },

      text: {
        /** 通常文字 */
        base: null,

        /** hover / emphasis */
        hover: null,

        /** Accent 背景上の文字 */
        onAccent: null,
      },

      border: {
        /** 通常境界線 */
        default: null,

        /** より明確な境界線 */
        subtle: null,

        /** Accent 境界線 */
        accent: null,

        /** ハイライト時の内側境界線 */
        highlight: null,
      },

      accent: {
        /** Primary accent */
        base: null,

        /** Accent hover */
        hover: null,

        /** Neon cyan */
        neonCyan: null,

        /** Neon pink */
        neonPink: null,

        /** Neon white */
        neonWhite: null,
      },

      status: {
        total: null,
        success: null,
        running: null,
        ready: null,
        needsAction: null,
        waiting: null,
        scheduled: null,
        error: null,
      },

      /** ステータス別背景ティント */
      statusTint: {
        success: null,
        warning: null,
        error: null,
      },

      /** カレンダー曜日・祝日カラー */
      calendar: {
        saturday: null,
        holiday: null,
      },
    },

    /* ==========================================================
     * Glassmorphism
     * ========================================================== */

    glass: {
      surface: null,
      surfaceSubtle: null,
      border: null,
      borderStrong: null,
      blur: null,
      blurStrong: null,
      saturation: null,

      contextMenu: {
        surface: null,
        border: null,
        blur: null,
        saturation: null,
      },
    },

    /* ==========================================================
     * Gradient
     * ========================================================== */

    gradient: {
      brand: null,
    },

    /* ==========================================================
     * Shadow
     * ========================================================== */

    shadow: {
      highlight: null,
      contextMenu: null,

      raised: {
        low: null,
        md: null,
        high: null,
      },

      pressed: {
        low: null,
        md: null,
        high: null,
      },

      glow: {
        brand: null,
        cyan: null,
        white: null,

        total: null,
        error: null,
        success: null,
        running: null,
        waiting: null,
        needsAction: null,
        ready: null,
        scheduled: null,
      },

      /** ホバー・アクティブ時の発光＋浮き上がり合成シャドウ */
      glowRaised: {
        md: null,
        high: null,
      },
    },

    /* ==========================================================
     * Typography
     * ========================================================== */

    font: {
      base: null,
      mono: null,

      size: {
        xs: null,
        sm: null,
        md: null,
        lg: null,
        xl: null,
      },

      fluid: {
        sm: null,
        md: null,
        lg: null,
      },

      weight: {
        normal: null,
        medium: null,
        bold: null,
      },
    },

    /* ==========================================================
     * Spacing
     * ========================================================== */

    space: {
      xs: null,
      sm: null,
      md: null,
      lg: null,
      xl: null,
    },

    /* ==========================================================
     * Component Dimensions
     * ========================================================== */

    size: {
      /** ボタン・タブバー等の標準コントロール高さ */
      controlHeight: null,
      /** テーブルの標準行・単層ヘッダー高さ */
      tableRowHeight: null,
      /** グループヘッダーを持つテーブルのヘッダー高さ */
      tableHeaderGroupHeight: null,
      /** ラベル・バッジ等の標準固定幅 */
      badgeWidth: null,
    },

    /* ==========================================================
     * Radius
     * ========================================================== */

    radius: {
      sm: null,
      md: null,
      lg: null,
      full: null,
    },

    /* ==========================================================
     * Transition
     * ========================================================== */

    transition: {
      fast: null,
      normal: null,
      ease: null,
      /** ネオングロー発光・境界線ハイライト用トランジション */
      glow: null,
    },

    /* ==========================================================
     * Z-index
     * ========================================================== */

    zIndex: {
      base: null,
      under: null,
      active: null,
      content: null,
      sticky: null,
      dropdown: null,
      contextMenu: null,
      overlay: null,
      modal: null,
      toast: null,
      tooltip: null,
      globalOverlay: null,
    },
  },

  (_, path) => path.join("-"),
);
