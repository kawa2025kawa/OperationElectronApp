// src/renderer/features/operation/components/table/operationTable.css.ts

import { style, styleVariants } from "@vanilla-extract/css";

import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

// 共通値

const transition = tokens.transition.normal;

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

// レイアウト

export const container = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  outline: "none",
  isolation: "isolate",
});

export const scrollContainer = style({
  position: "relative",
  flex: 1,
  minHeight: 0,
  width: "100%",
  overflow: "auto",
  paddingInline: tokens.space.md,
  scrollbarGutter: "stable",
  scrollbarWidth: "thin",
  scrollbarColor: `${tokens.color.accent.neonPink} transparent`,
  isolation: "isolate",

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

// テーブル

export const table = style({
  ...commonTable,
  borderCollapse: "separate",
  borderSpacing: `0 ${tokens.space.md}`,
});

export const thead = style({
  position: "sticky",
  top: 0,
  zIndex: 10,
  backgroundColor: tokens.color.bg.base,
});

export const headerRow = style({
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.raised.high,
});

// 行

export const tableRowBase = style([
  themeTransition,
  {
    height: "56px",
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    boxShadow: tokens.shadow.raised.low,
    outline: "none",
    transition: `color ${tokens.transition.fast}, box-shadow ${transition}`,

    selectors: {
      "&:focus": {
        outline: "none",
      },
      "&:focus-visible": {
        outline: "none",
      },
    },
  },
]);

export const tableRowStates = styleVariants({
  idle: {},

  clickable: {
    cursor: "pointer",
    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.high}`,
      },
      "&:active": {
        boxShadow: tokens.shadow.pressed.low,
      },
    },
  },

  selected: {
    boxShadow: tokens.shadow.pressed.low,
  },

  disabled: {
    opacity: 0.5,
    pointerEvents: "none",
    filter: "grayscale(0.8)",
  },
});

// セル

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
  position: "relative",
  zIndex: 1,
  selectors: rowEdgeRadius,
});

// 配置

export const alignVariants = styleVariants({
  left: {
    textAlign: "left",
  },
  center: {
    textAlign: "center",
  },
  right: {
    textAlign: "right",
  },
});

// セル内テキスト

export const cellText = style({
  display: "inline-block",
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
  transition: `color ${transition}, filter ${transition}`,

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

// 運用テーブル固有

export const statusCellWrapper = style({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  cursor: "context-menu",
});

export const modeContent = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: 0,
});

export const emptyCell = style({
  height: "240px",
  verticalAlign: "middle",
});
