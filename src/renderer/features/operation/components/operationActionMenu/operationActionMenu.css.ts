// src/renderer/features/operation/components/operationActionMenu/operationActionMenu.css.ts

import { style, keyframes } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

const t = tokens.transition.normal;

// ============================================================
// Keyframes (移動・変形を排除し、純粋な opacity フェードに統一)
// ============================================================

const fadeIn = keyframes({
  "0%": { opacity: 0 },
  "100%": { opacity: 1 },
});

const fadeOut = keyframes({
  "0%": { opacity: 1 },
  "100%": { opacity: 0 },
});

// ============================================================
// Menu Button
// ============================================================

export const menuButton = style([
  themeTransition,
  {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "40px",
    width: "100%",
    borderRadius: tokens.radius.full,
    border: `1px solid ${tokens.color.border.default}`,
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    cursor: "pointer",
    backgroundColor: tokens.color.bg.base,
    boxShadow: tokens.shadow.raised.high,
    backgroundImage: tokens.gradient.brand,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    outline: "none",
    transition: `border-color ${t}, box-shadow ${t}, opacity ${t}`,

    // シアン光とインセット影を重ねる擬似要素レイヤー
    "::before": {
      content: '""',
      position: "absolute",
      inset: -1,
      borderRadius: tokens.radius.full,
      boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.pressed.low}`,
      opacity: 0,
      transition: `opacity ${t}`,
      pointerEvents: "none",
    },

    selectors: {
      "&:hover:not(:disabled)::before": {
        opacity: 1,
      },
      "&:disabled": {
        opacity: 0.35,
        cursor: "not-allowed",
        boxShadow: tokens.shadow.raised.low,
        borderColor: tokens.color.border.subtle,
      },
    },
  },
]);

// ============================================================
// Dropdown Content
// ============================================================

export const menuDropdownContent = style([
  themeTransition,
  {
    width: "var(--radix-dropdown-menu-trigger-width)",
    boxSizing: "border-box",
    height: "200px",
    maxHeight: "var(--radix-dropdown-menu-content-available-height, 60vh)",
    overflowY: "auto",
    scrollbarWidth: "none",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gridTemplateRows: "repeat(2, 1fr)",
    justifyItems: "center",
    alignItems: "center",
    gap: tokens.space.xs,
    padding: tokens.space.sm,
    borderRadius: tokens.radius.lg,

    border: `2px solid ${tokens.color.border.subtle}`,
    backgroundColor: tokens.glass.surface,
    backdropFilter: "blur(12px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(200%) brightness(1.2)",

    boxShadow: tokens.shadow.raised.high,
    zIndex: `calc(${tokens.zIndex.dropdown} + 1)`,

    selectors: {
      "&::-webkit-scrollbar": {
        display: "none",
      },
      "&[data-state='open']": {
        animation: `${fadeIn} 180ms ease-out`,
      },
      "&[data-state='closed']": {
        animation: `${fadeOut} 150ms ease-out`,
      },
    },
  },
]);

// ============================================================
// Dropdown Item (丸ボタン)
// ============================================================

export const menuItem = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    width: "72px",
    height: "72px",
    borderRadius: "50%",
    boxSizing: "border-box",

    padding: tokens.space.xs,
    backgroundColor: tokens.color.bg.base,

    border: `2px solid ${tokens.color.text.onAccent}`,
    boxShadow: `${tokens.shadow.glow.white}, ${tokens.shadow.raised.low}`,

    outline: "none",
    fontSize: tokens.font.size.xs,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text.onAccent,
    cursor: "pointer",
    textAlign: "center",
    whiteSpace: "normal",
    wordBreak: "normal",
    overflowWrap: "normal",
    lineHeight: 1.15,

    transition: `box-shadow ${t}, border-color ${t}, color ${t}`,

    selectors: {
      "&:hover, &:focus, &:focus-visible": {
        borderColor: tokens.color.accent.neonCyan,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
        color: tokens.color.accent.neonCyan,
        outline: "none",
      },
    },
  },
]);
