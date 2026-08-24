import { createGlobalThemeContract } from "@vanilla-extract/css";

/**
 * ============================================================
 * Semantic Design Token Contract
 * ============================================================
 *
 * このファイルでは「何が存在するか」だけを定義する。
 *
 * 実際の値は theme.css.ts の Dark / Light Theme で定義する。
 *
 * 設計方針:
 *
 *   color    -> 色・意味
 *   glass    -> Glassmorphism
 *   gradient -> Gradient
 *   shadow   -> Neumorphism / Glow
 *   font     -> Typography
 *   space    -> Spacing
 *   radius   -> Border Radius
 *   transition -> Motion
 *   zIndex   -> Layer
 * ============================================================
 */

export const tokens = createGlobalThemeContract(
  {
    /* ==========================================================
     * Color
     * ========================================================== */

    color: {
      bg: {
        /** アプリ全体のベース背景 */
        base: null,

        /** 通常の surface */
        surface: null,

        /** 凹み・inset surface */
        inset: null,

        /** Header / navigation 系 */
        header: null,
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
      },

      status: {
        total: null,
        success: null,
        running: null,
        ready: null,
        waiting: null,
        scheduled: null,
        error: null,
      },
    },

    /* ==========================================================
     * Glassmorphism
     * ========================================================== */

    glass: {
      /**
       * 標準 Glass surface
       *
       * background-color に使用する。
       */
      surface: null,

      /**
       * より透明度の高い Glass surface
       */
      surfaceSubtle: null,

      /**
       * Glass の border
       */
      border: null,

      /**
       * 強調された Glass border
       */
      borderStrong: null,

      /**
       * 標準 blur
       */
      blur: null,

      /**
       * 強い blur
       */
      blurStrong: null,

      /**
       * 色の彩度
       */
      saturation: null,
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
      /**
       * Neumorphism:
       * surface が浮いて見える
       */
      raised: {
        low: null,
        md: null,
        high: null,
      },

      /**
       * Neumorphism:
       * surface が押し込まれて見える
       */
      pressed: {
        low: null,
        md: null,
        high: null,
      },

      /**
       * Accent / Status の glow
       */
      glow: {
        brand: null,
        cyan: null,
        white: null,

        total: null,
        error: null,
        success: null,
        running: null,
        waiting: null,
        ready: null,
        scheduled: null,
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
