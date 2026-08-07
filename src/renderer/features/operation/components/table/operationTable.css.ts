// src\renderer\features\operation\components\table\operationTable.css.ts
import { createVar, style, styleVariants } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

const rowTextColor = createVar();
const rowShadow = createVar();
const rowBgColor = createVar();

const rowEdgeRadius = {
  "tr > &:first-child": {
    borderRadius: `${tokens.radius.md} 0 0 ${tokens.radius.md}`,
  },
  "tr > &:last-child": {
    borderRadius: `0 ${tokens.radius.md} ${tokens.radius.md} 0`,
  },
};

export const container = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  outline: "none",
});

export const bodyWrapper = style({
  flex: 1,
  width: "100%",
  overflowX: "hidden",
  overflowY: "auto",
  paddingInline: tokens.space.md,
  scrollbarGutter: "stable",
});

export const tableStyle = style({
  width: "100%",
  tableLayout: "fixed",
  borderCollapse: "separate",
  borderSpacing: `0 ${tokens.space.md}`,
});

export const tableRowBase = style([
  themeTransition,
  {
    position: "relative",
    height: "56px",
    borderRadius: tokens.radius.md,
    backgroundColor: rowBgColor,
    color: rowTextColor,
    boxShadow: rowShadow,
    transition:
      "box-shadow 0.25s ease-out, color 0.25s ease-out, background-color 0.25s ease-out",
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
      [rowBgColor]: tokens.color.bg.inset,
      [rowShadow]: tokens.shadow.pressed.md,
      [rowTextColor]: "transparent",
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

export const cellText = style({
  display: "inline-block",
  maxWidth: "100%",
  verticalAlign: "middle",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  transition: "color 0.25s ease, filter 0.25s ease",
  selectors: {
    [`${tableRowStates.selected} &`]: {
      backgroundImage: tokens.gradient.brand,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
    },
  },
});

export const thBase = style([
  themeTransition,
  {
    height: "56px",
    paddingInline: tokens.space.lg,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    boxShadow: tokens.shadow.raised.low,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    selectors: {
      "&:first-child": {
        borderRadius: `${tokens.radius.md} 0 0 ${tokens.radius.md}`,
      },
      "&:last-child": {
        borderRadius: `0 ${tokens.radius.md} ${tokens.radius.md} 0`,
      },
    },
  },
]);

export const thAlignVariants = styleVariants({
  left: { textAlign: "left" },
  center: { textAlign: "center" },
  right: { textAlign: "right" },
});

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

export const statusCellWrapper = style({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  cursor: "context-menu",
});
