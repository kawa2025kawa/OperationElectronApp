// src/renderer/components/ui/button/actionButton/actionButton.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

// ベーススタイル（全バリアント共通）
export const actionButton = style([
  themeTransition,
  {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    fontWeight: tokens.font.weight.bold,
    cursor: "pointer",
    outline: "none",
    transition: tokens.transition.fast,
    textDecoration: "none",

    selectors: {
      "&:disabled": {
        opacity: 0.35,
        cursor: "not-allowed",
        pointerEvents: "none",
        backgroundColor: tokens.color.bg.base,
        borderColor: tokens.color.border.subtle,
        color: tokens.color.text.base,
        boxShadow: tokens.shadow.pressed.low,
        filter: "grayscale(60%)",
        textShadow: "none",
      },
    },
  },
]);

// バリアントスタイル定義
export const variants = styleVariants({
  default: {
    padding: "1vmin 2.5vmin",
    minWidth: "120px",
    borderRadius: tokens.radius.md,
    fontSize: tokens.font.fluid.sm,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    border: `1px solid ${tokens.color.border.default}`,
    boxShadow: `${tokens.shadow.raised.md}, 0 4px 10px rgba(0, 0, 0, 0.4)`,

    selectors: {
      "&:hover:not(:disabled)": {
        borderColor: tokens.color.accent.neonCyan,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.high}, 0 6px 16px rgba(0, 0, 0, 0.5)`,
        color: tokens.color.text.onAccent,
      },
      "&:active:not(:disabled)": {
        boxShadow: `${tokens.shadow.pressed.md}, inset 0 2px 4px rgba(0, 0, 0, 0.5)`,
      },
    },
  },
  tab: {
    padding: "0.8vmin 2vmin",
    borderRadius: tokens.radius.md,
    fontSize: tokens.font.fluid.sm,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base, // muted から base へ修正
    opacity: 0.8,
    border: `1px solid ${tokens.color.border.subtle}`,
    boxShadow: tokens.shadow.pressed.low,

    selectors: {
      "&:hover:not(:disabled)": {
        opacity: 1,
        borderColor: tokens.color.border.default,
      },
      "&[data-active='true']": {
        opacity: 1,
        backgroundColor: tokens.color.bg.base,
        color: tokens.color.accent.neonCyan,
        borderColor: tokens.color.accent.neonCyan,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      },
    },
  },
  pill: {
    padding: "0.4vmin 1.6vmin",
    borderRadius: tokens.radius.full,
    fontSize: tokens.font.fluid.sm, // xs から sm へ修正
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    border: `1px solid ${tokens.color.border.default}`,
    boxShadow: tokens.shadow.raised.low,

    selectors: {
      "&:hover:not(:disabled)": {
        borderColor: tokens.color.accent.neonCyan,
        color: tokens.color.accent.neonCyan,
        boxShadow: tokens.shadow.glow.cyan,
      },
      "&:active:not(:disabled)": {
        boxShadow: tokens.shadow.pressed.md,
      },
    },
  },
});
