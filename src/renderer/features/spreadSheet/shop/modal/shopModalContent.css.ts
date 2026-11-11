// src/renderer/features/spreadSheet/shop/modal/shopModalContent.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

const BADGE_WIDTH = "60px";

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

const ellipsisStyle = {
  whiteSpace: "nowrap" as const,
  overflow: "hidden" as const,
  textOverflow: "ellipsis" as const,
};

export const mainContainer = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
  gap: tokens.space.md,
  isolation: "isolate",
});

export const contentContainer = style({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  gap: tokens.space.md,
  padding: "4px",
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

export const trTabWrapper = style({
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.md,
  isolation: "isolate",
});

export const terminalSection = style({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  width: "100%",
  isolation: "isolate",
});

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
    isolation: "isolate",
  },
]);

export const terminalHeaderBadge = style({
  width: BADGE_WIDTH,
  flexShrink: 0,
  textAlign: "center",
});

export const terminalHeaderGrid = style([
  gridBase,
  {
    ...ellipsisStyle,
  },
]);

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
  transition: `color ${tokens.transition.fast}`,
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
  ...ellipsisStyle,
  fontWeight: tokens.font.weight.bold,
  transition: `color ${tokens.transition.fast}`,
});

export const buttonContainer = style({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: tokens.space.sm,
  marginTop: tokens.space.xs,
  isolation: "isolate",
});
