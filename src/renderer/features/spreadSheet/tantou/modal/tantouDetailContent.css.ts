// src/renderer/features/spreadSheet/tantou/modal/tantouDetailContent.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

const smoothGlow = "0.8s cubic-bezier(0.25, 0.8, 0.25, 1)";
const t = tokens.transition.normal;

const detailRowBase = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 16px",
  boxSizing: "border-box" as const,
};

export const container = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: 0,
  gap: tokens.space.md,
  isolation: "isolate",
});

export const tabBar = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  width: "100%",
  height: "40px",
  padding: tokens.space.xs,
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.pressed.high,
  boxSizing: "border-box",
  flexShrink: 0,
  isolation: "isolate",
});

export const tabSlider = style({
  position: "absolute",
  inset: 0,
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.raised.high,
  zIndex: 0,
  transform: "translateZ(0)",
  willChange: "transform",

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

export const tabButton = style({
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
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  transition: `color ${t}`,
  whiteSpace: "nowrap",
  isolation: "isolate",

  selectors: {
    "&:hover": {
      color: tokens.color.text.hover,
    },
    "&:focus-visible": {
      outline: `2px solid ${tokens.color.accent.neonCyan}`,
      outlineOffset: "2px",
    },
  },
});

export const buttonText = style({
  position: "relative",
  zIndex: 1,
  transition: `color ${t}`,
  selectors: {
    [`${tabButton}[data-active] &`]: {
      backgroundImage: tokens.gradient.brand,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
    },
  },
});

export const listContainer = style({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  gap: tokens.space.md,
  padding: "4px",
  boxSizing: "border-box",
  isolation: "isolate",

  scrollbarGutter: "stable",
  scrollbarWidth: "thin",
  scrollbarColor: `${tokens.color.accent.neonPink} transparent`,

  selectors: {
    "&::-webkit-scrollbar": {
      width: "4px",
      height: "4px",
      display: "block",
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: tokens.color.accent.neonPink,
      borderRadius: tokens.radius.full,
    },
    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor: tokens.color.accent.neonPink,
    },
  },
});

export const detailList = style({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  width: "100%",
});

export const detailRow = style([
  themeTransition,
  detailRowBase,
  {
    position: "relative",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.low,
    color: tokens.color.text.base,
    isolation: "isolate",
    transform: "translateZ(0)",
    transition: `color ${tokens.transition.fast}`,

    "::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      borderRadius: tokens.radius.md,
      boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      opacity: 0,
      transition: `opacity ${tokens.transition.normal}`,
      pointerEvents: "none",
      willChange: "opacity",
    },

    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
      },
      "&:hover::before": {
        opacity: 1,
      },
    },
  },
]);

export const fieldLabel = style({
  position: "relative",
  zIndex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  flexShrink: 0,
  boxSizing: "border-box",
  width: "120px",
  height: "36px",
  paddingLeft: "16px",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.sm,
  boxShadow: tokens.shadow.pressed.md,
  color: tokens.color.accent.base,
  fontSize: "15px",
  fontWeight: tokens.font.weight.bold,
});

export const fieldValueContainer = style({
  position: "relative",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  flex: 1,
  minWidth: 0,
});

export const fieldValue = style({
  overflow: "hidden",
  fontSize: tokens.font.fluid.md,
  fontWeight: tokens.font.weight.bold,
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  transition: `color ${tokens.transition.fast}`,
});
