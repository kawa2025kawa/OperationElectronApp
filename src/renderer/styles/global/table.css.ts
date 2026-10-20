// src/renderer/styles/global/table.css.ts

import { createVar, style, styleVariants } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

// Internal CSS variables
const rowTextColor = createVar();
const rowShadow = createVar();
const rowBgColor = createVar();

// Shared table styles
const commonTable = {
  width: "100%",
  tableLayout: "fixed",
} satisfies Parameters<typeof style>[0];

const rowEdgeRadius = {
  "tr > &:first-child": {
    borderRadius: `${tokens.radius.md} 0 0 ${tokens.radius.md}`,
  },
  "tr > &:last-child": {
    borderRadius: `0 ${tokens.radius.md} ${tokens.radius.md} 0`,
  },
};

const defaultRowVars = {
  [rowBgColor]: tokens.color.bg.base,
  [rowTextColor]: tokens.color.text.base,
  [rowShadow]: tokens.shadow.raised.low,
};

// Layout
export const tableContainer = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  outline: "none",
});

export const container = tableContainer;

export const headerWrapper = style({
  position: "relative",
  zIndex: 10,
  flexShrink: 0,
  paddingInline: tokens.space.md,
  borderRadius: tokens.radius.md,
  boxShadow: tokens.shadow.raised.low,
});

export const bodyWrapper = style({
  position: "relative",
  zIndex: 0,
  flex: 1,
  minHeight: 0,
  overflowX: "hidden",
  overflowY: "auto",
  paddingInline: tokens.space.md,
  paddingTop: tokens.space.sm,
  scrollbarGutter: "stable",
});

// Tables
export const headerTable = style({
  ...commonTable,
  borderCollapse: "collapse",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.md,
  overflow: "hidden",
});

export const bodyTable = style({
  ...commonTable,
  borderCollapse: "separate",
  borderSpacing: `0 ${tokens.space.md}`,
});

// Rows
export const tableRowBase = style([
  themeTransition,
  {
    position: "relative",
    height: "56px",
    backgroundColor: rowBgColor,
    color: rowTextColor,
    boxShadow: rowShadow,
    isolation: "isolate",
    transform: "translateZ(0)",
    zIndex: 0,
    // 🎯 ハードコードをトークン参照に修正
    transition: `box-shadow ${tokens.transition.normal}, background-color ${tokens.transition.normal}, color ${tokens.transition.normal}`,
  },
]);

export const tableRowStates = styleVariants({
  idle: {
    vars: { ...defaultRowVars },
  },

  clickable: {
    vars: { ...defaultRowVars },
    cursor: "pointer",
    selectors: {
      "&:hover": {
        vars: {
          [rowTextColor]: tokens.color.text.hover,
          [rowShadow]: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
        },
        zIndex: 1,
      },
      "&:active": {
        vars: {
          [rowShadow]: tokens.shadow.pressed.low,
        },
      },
    },
  },

  selected: {
    vars: {
      ...defaultRowVars,
      [rowTextColor]: "transparent",
      [rowShadow]: tokens.shadow.pressed.md,
    },
  },

  disabled: {
    vars: {
      ...defaultRowVars,
    },
    opacity: 0.5,
    pointerEvents: "none",
    filter: "grayscale(0.8)",
  },
});

// Cells
export const thBase = style([
  themeTransition,
  {
    height: "56px",
    paddingInline: tokens.space.lg,
    backgroundColor: "transparent",
    color: tokens.color.text.base,
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    selectors: rowEdgeRadius,
  },
]);

export const tdBase = style({
  paddingInline: tokens.space.lg,
  color: "inherit",
  fontSize: tokens.font.size.md,
  fontWeight: tokens.font.weight.medium,
  selectors: rowEdgeRadius,
});

// Alignment
export const alignVariants = styleVariants({
  left: { textAlign: "left" },
  center: { textAlign: "center" },
  right: { textAlign: "right" },
});

export const thAlignVariants = alignVariants;
export const tdAlignVariants = alignVariants;

// Cell text
export const cellText = style({
  display: "inline-block",
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
  transition: "color 0.25s ease, filter 0.25s ease",
  selectors: {
    [`${tableRowStates.selected} &`]: {
      backgroundImage: tokens.gradient.brand,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
      WebkitTextFillColor: "transparent",
    },
  },
});

// 休日強調スタイル
export const cellTextHoliday = style({
  color: tokens.color.accent.neonPink ?? "#ff4d4f",
  fontWeight: "bold",
});
