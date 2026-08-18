// src/renderer/components/ui/table/dataTable.css.ts

import { createVar, style, styleVariants } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

/* -------------------------------------------------------------------------- */
/* CSS Variables                                                              */
/* -------------------------------------------------------------------------- */

const rowTextColor = createVar();
const rowShadow = createVar();
const rowBgColor = createVar();

/* -------------------------------------------------------------------------- */
/* Shared Styles                                                              */
/* -------------------------------------------------------------------------- */

const rowEdgeRadius = {
  "tr > &:first-child": {
    borderRadius: `${tokens.radius.md} 0 0 ${tokens.radius.md}`,
  },
  "tr > &:last-child": {
    borderRadius: `0 ${tokens.radius.md} ${tokens.radius.md} 0`,
  },
};

const commonTable = {
  width: "100%",
  tableLayout: "fixed",
} satisfies Parameters<typeof style>[0];

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

export const container = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  outline: "none",
});

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

/* -------------------------------------------------------------------------- */
/* Tables                                                                     */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Rows                                                                       */
/* -------------------------------------------------------------------------- */

export const tableRowBase = style([
  themeTransition,
  {
    position: "relative",
    height: "56px",
    backgroundColor: rowBgColor,
    color: rowTextColor,
    boxShadow: rowShadow,
    transition:
      "box-shadow 0.25s ease-out, background-color 0.25s ease-out, color 0.25s ease-out",
  },
]);

export const tableRowStates = styleVariants({
  idle: {
    vars: {
      [rowBgColor]: tokens.color.bg.base,
      [rowTextColor]: tokens.color.text.base,
      [rowShadow]: tokens.shadow.raised.low,
    },
  },
  clickable: {
    vars: {
      [rowBgColor]: tokens.color.bg.base,
      [rowTextColor]: tokens.color.text.base,
      [rowShadow]: tokens.shadow.raised.low,
    },
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
      [rowBgColor]: tokens.color.bg.base,
      [rowTextColor]: "transparent",
      [rowShadow]: tokens.shadow.pressed.md,
    },
  },
  disabled: {
    vars: {
      [rowBgColor]: tokens.color.bg.base,
      [rowTextColor]: tokens.color.text.base,
      [rowShadow]: tokens.shadow.raised.low,
    },
    opacity: 0.5,
    pointerEvents: "none",
    filter: "grayscale(0.8)",
  },
});

/* -------------------------------------------------------------------------- */
/* Header Cells                                                               */
/* -------------------------------------------------------------------------- */

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

export const thAlignVariants = styleVariants({
  left: { textAlign: "left" },
  center: { textAlign: "center" },
  right: { textAlign: "right" },
});

/* -------------------------------------------------------------------------- */
/* Body Cells                                                                 */
/* -------------------------------------------------------------------------- */

export const tdBase = style({
  paddingInline: tokens.space.lg,
  color: "inherit",
  fontSize: tokens.font.size.md,
  fontWeight: tokens.font.weight.medium,
  selectors: rowEdgeRadius,
});

export const tdAlignVariants = styleVariants({
  left: { textAlign: "left" },
  center: { textAlign: "center" },
  right: { textAlign: "right" },
});

/* -------------------------------------------------------------------------- */
/* Cell Content                                                               */
/* -------------------------------------------------------------------------- */

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
