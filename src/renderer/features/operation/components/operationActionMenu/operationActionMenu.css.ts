// src/renderer/features/operation/components/operationActionMenu/operationActionMenu.css.ts

import { style } from "@vanilla-extract/css";

import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

const t = tokens.transition.normal;

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
// Dropdown Positioner
// ============================================================

export const menuDropdownPositioner = style({
  zIndex: `calc(${tokens.zIndex.dropdown} + 1)`,
});

// ============================================================
// Dropdown Content
// ============================================================

export const menuDropdownContent = style([
  themeTransition,
  {
    width: "var(--anchor-width)",
    boxSizing: "border-box",
    minHeight: "200px",
    maxHeight: "var(--available-height, 60vh)",
    overflowY: "auto",
    scrollbarWidth: "thin",
    scrollbarColor: `${tokens.color.accent.neonPink} transparent`,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gridAutoRows: "minmax(80px, auto)",
    justifyItems: "center",
    alignItems: "center",
    gap: tokens.space.xs,
    padding: tokens.space.sm,
    borderRadius: tokens.radius.lg,

    // Context Menu 共通 Glass トークン
    border: `1px solid ${tokens.glass.contextMenu.border}`,
    backgroundColor: tokens.glass.contextMenu.surface,

    backdropFilter: `blur(${tokens.glass.contextMenu.blur}) saturate(${tokens.glass.contextMenu.saturation})`,
    WebkitBackdropFilter: `blur(${tokens.glass.contextMenu.blur}) saturate(${tokens.glass.contextMenu.saturation})`,

    boxShadow: tokens.shadow.contextMenu,
    opacity: 1,
    transition: "opacity 180ms ease-out",

    selectors: {
      "&::-webkit-scrollbar": {
        width: "4px",
      },
      "&::-webkit-scrollbar-track": {
        backgroundColor: "transparent",
      },
      "&::-webkit-scrollbar-thumb": {
        backgroundColor: tokens.color.accent.neonPink,
        borderRadius: tokens.radius.full,
      },
      "&[data-starting-style]": {
        opacity: 0,
      },
      "&[data-ending-style]": {
        opacity: 0,
      },
    },
  },
]);

// ============================================================
// Dropdown Item (丸ボタン：通常時は白、ホバー時のみブランドグラデーション)
// ============================================================

export const menuItem = style([
  themeTransition,
  {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    width: "72px",
    height: "72px",
    borderRadius: "50%",
    boxSizing: "border-box",

    padding: "2px",
    border: "none",
    backgroundColor: tokens.color.text.onAccent,
    backgroundImage: "none",
    boxShadow: `${tokens.shadow.glow.white}, ${tokens.shadow.raised.low}`,

    outline: "none",
    cursor: "pointer",

    transition: `box-shadow ${t}, background-color ${t}`,

    selectors: {
      "&:hover, &[data-highlighted]": {
        backgroundColor: "transparent",
        backgroundImage: tokens.gradient.brand,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
        outline: "none",
      },
    },
  },
]);

export const menuItemInner = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    boxSizing: "border-box",
    padding: tokens.space.xs,
    backgroundColor: tokens.color.bg.base,
  },
]);

export const menuItemLabel = style({
  display: "inline-block",
  fontSize: tokens.font.size.xs,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.onAccent,
  textAlign: "center",
  whiteSpace: "normal",
  wordBreak: "normal",
  overflowWrap: "normal",
  lineHeight: 1.15,
  transition: `color ${t}`,

  selectors: {
    [`${menuItem}:hover &, ${menuItem}[data-highlighted] &`]: {
      backgroundImage: tokens.gradient.brand,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      WebkitTextFillColor: "transparent",
      color: "transparent",
    },
  },
});
