// src/renderer/components/ui/toggle/segmentedControl.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

const smoothGlow = "0.8s cubic-bezier(0.25, 0.8, 0.25, 1)";
const t = tokens.transition.normal;

// ============================================================
// Container
// ============================================================

export const containerBase = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  padding: tokens.space.xs,
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.pressed.high,
  boxSizing: "border-box",
  // ホバー時の影や発光の再描画をコンテナ内に封じ込める
  isolation: "isolate",
  transform: "translateZ(0)",
  contain: "paint",
});

export const containerSize = styleVariants({
  sm: { height: "32px" },
  md: { height: "40px" },
  lg: { height: "48px" },
});

export const containerWidth = styleVariants({
  full: { width: "100%" },
  auto: { width: "auto" },
});

// ============================================================
// Slider
// ============================================================

export const slider = style({
  position: "absolute",
  inset: 0,
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.bg.base,
  boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.high}`,
  zIndex: 0,
  transform: "translateZ(0)",

  "::before": {
    content: '""',
    position: "absolute",
    inset: -1,
    borderRadius: tokens.radius.full,
    boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.pressed.low}`,
    opacity: 1,
    transition: `opacity ${smoothGlow}`,
    pointerEvents: "none",
  },
});

// ============================================================
// Item Button
// ============================================================

export const itemButtonBase = style({
  flex: 1,
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  padding: "0 0.75rem",
  border: "none",
  borderRadius: tokens.radius.full,
  outline: "none",
  cursor: "pointer",
  backgroundColor: "transparent",
  fontFamily: tokens.font.base,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  transition: `color ${t}`,
  whiteSpace: "nowrap",
  transform: "translateZ(0)",

  "::before": {
    content: '""',
    position: "absolute",
    inset: -1,
    borderRadius: tokens.radius.full,
    boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.low}`,
    opacity: 0,
    transition: `opacity ${smoothGlow}`,
    pointerEvents: "none",
    zIndex: 0,
    willChange: "opacity",
  },

  selectors: {
    "&:hover": {
      color: tokens.color.text.hover,
    },
    '&:hover:not([data-active="true"])::before': {
      opacity: 1,
    },
  },
});

// ============================================================
// Item Button Size
// ============================================================

export const itemButtonSize = styleVariants({
  sm: { fontSize: tokens.font.size.xs },
  md: { fontSize: tokens.font.size.sm },
  lg: { fontSize: tokens.font.size.md },
});

// ============================================================
// Item Text
// ============================================================

export const itemText = style({
  position: "relative",
  zIndex: 1,
  transition: `color ${t}`,

  selectors: {
    '&[data-active="true"]': {
      backgroundImage: tokens.gradient.brand,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
    },
  },
});
