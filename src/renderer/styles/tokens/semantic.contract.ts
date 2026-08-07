/* src/renderer/styles/tokens/semantic.contract.ts */
import { createGlobalThemeContract } from "@vanilla-extract/css";

export const tokens = createGlobalThemeContract(
  {
    color: {
      /* =========================
         背景 Background
      ========================= */
      bg: {
        base: null,
        surface: null,
        inset: null,
        header: null,
      },

      /* =========================
         文字 Text
      ========================= */
      text: {
        base: null,
        hover: null,
        onAccent: null,
      },

      /* =========================
         邊框 Border
      ========================= */
      border: {
        default: null,
        subtle: null,
        accent: null,
      },

      /* =========================
         強調色 Accent
      ========================= */
      accent: {
        base: null,
        hover: null,
        neonCyan: null,
        neonPink: null,
      },

      /* =========================
         狀態 Status
      ========================= */
      status: {
        total: null,
        success: null,
        running: null,
        ready: null, // 🎯 READY用としてそのまま使用（色コードを割り当てる場合はここに記述）
        waiting: null, // 🚨 pending を waiting に変更！
        scheduled: null,
        error: null,
      },
    },

    /* =========================
       漸層 Gradient
    ========================= */
    gradient: {
      brand: null,
    },

    /* =========================
       陰影 Shadow
    ========================= */
    shadow: {
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
        total: null,
        error: null,
        success: null,
        running: null,
        waiting: null,
        ready: null,
        scheduled: null,
      },
    },

    /* =========================
       字體 Font
    ========================= */
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

    /* =========================
       間距 Spacing
    ========================= */
    space: {
      xs: null,
      sm: null,
      md: null,
      lg: null,
      xl: null,
    },

    /* =========================
       圓角 Radius
    ========================= */
    radius: {
      sm: null,
      md: null,
      lg: null,
      full: null,
    },

    /* =========================
       轉場效果 Transition
    ========================= */
    transition: {
      fast: null,
      normal: null,
      ease: null,
    },

    /* =========================
       層級 Z-index
    ========================= */
    zIndex: {
      base: null,
      under: null,
      active: null,
      content: null,
      sticky: null,
      dropdown: null,
      overlay: null,
      modal: null,
      toast: null,
      tooltip: null,
      globalOverlay: null,
    },
  },
  (_, path) => path.join("-"),
);
