// src/renderer/features/spreadSheet/shop/modal/shopModalContent.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

const BADGE_WIDTH = "60px";

const flexColumn = style({
  display: "flex",
  flexDirection: "column",
});

const rowBase = style({
  display: "flex",
  alignItems: "center",
  gap: tokens.space.md,
  padding: "12px 16px",
});

const gridBase = style({
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  flex: 1,
  gap: tokens.space.md,
  alignItems: "center",
});

export const mainContainer = style([
  flexColumn,
  {
    height: "100%",
    minHeight: 0,
    gap: tokens.space.md,
  },
]);

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
  boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.high}`,
  zIndex: 0,
  transform: "translateZ(0)",
  willChange: "transform",

  "::before": {
    content: '""',
    position: "absolute",
    inset: -1,
    borderRadius: tokens.radius.full,
    boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.pressed.low}`,
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
  transition: `color ${tokens.transition.normal}`,
  whiteSpace: "nowrap",

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

export const contentContainer = style([
  flexColumn,
  {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    gap: tokens.space.md,
    padding: "4px",
    scrollbarGutter: "stable",
    scrollbarWidth: "thin",
    scrollbarColor: `${tokens.color.accent.neonPink} transparent`,

    selectors: {
      "&::-webkit-scrollbar": {
        width: "4px",
        height: "4px",
      },
      "&::-webkit-scrollbar-track": {
        backgroundColor: "transparent",
      },
      "&::-webkit-scrollbar-thumb": {
        backgroundColor: tokens.color.accent.neonPink,
        borderRadius: tokens.radius.full,
      },
    },
  },
]);

export const trTabWrapper = style([
  flexColumn,
  {
    gap: tokens.space.md,
  },
]);

export const terminalSection = style([
  flexColumn,
  {
    gap: "6px",
    width: "100%",
  },
]);

export const terminalHeaderRow = style([
  rowBase,
  {
    paddingTop: "6px",
    paddingBottom: "6px",
    borderBottom: `1px solid ${tokens.color.border.default}`,
    marginBottom: "2px",
    fontSize: tokens.font.fluid.md,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text.hover,
  },
]);

export const terminalHeaderBadge = style({
  width: BADGE_WIDTH,
  flexShrink: 0,
  textAlign: "center",
});

export const terminalHeaderGrid = gridBase;

export const terminalRow = style([
  themeTransition,
  rowBase,
  {
    position: "relative",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.low,
    fontSize: tokens.font.fluid.md,
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

export const terminalBadge = style({
  position: "relative",
  zIndex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: BADGE_WIDTH,
  height: "36px",
  flexShrink: 0,
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.sm,
  boxShadow: tokens.shadow.pressed.md,
  fontWeight: tokens.font.weight.bold,
  letterSpacing: "0.5px",
});

export const nonTrBadge = style([
  terminalBadge,
  {
    width: "120px",
    justifyContent: "flex-start",
    paddingLeft: "16px",
  },
]);

export const flexCell = style({
  position: "relative",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minWidth: 0,
  flex: 1,
});

export const terminalGrid = style([
  gridBase,
  {
    position: "relative",
    zIndex: 1,
  },
]);

export const cellValue = style({
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  fontWeight: tokens.font.weight.bold,
});

export const buttonContainer = style({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: tokens.space.sm,
  marginTop: tokens.space.xs,
});
