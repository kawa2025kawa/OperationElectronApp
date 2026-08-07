// src/renderer/features/spreadSheet/components/table/spreadSheetTable.css.ts

import { createVar, style, styleVariants } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

/* =========================
 * Row Variables
 * ========================= */
const rowTextColor = createVar();
const rowShadow = createVar();
const rowBgColor = createVar();

/* =========================
 * Layout
 * ========================= */
export const container = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  outline: "none",
});

export const headerArea = style({
  width: "100%",
  flexShrink: 0,
  paddingInline: tokens.space.md,
});

export const bodyWrapper = style({
  flex: 1,
  width: "100%",
  overflowX: "auto", // 横スクロールにも対応
  overflowY: "auto",
  paddingInline: tokens.space.md,
  paddingBottom: tokens.space.md,
  scrollbarGutter: "stable",
});

export const tableStyle = style({
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
});

export const stickyHeader = style({
  position: "sticky",
  top: 0,
  zIndex: 10,
  display: "block",
  paddingBottom: tokens.space.sm, // ヘッダーとデータ行の間の隙間
});

/* =========================
 * Table Header Row (データ行 tr と全く同じカード構造)
 * ========================= */
export const tableHeaderRow = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    width: "100%",
    height: "56px",
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.bg.base,
    boxShadow: tokens.shadow.raised.low,
    boxSizing: "border-box",
  },
]);

/* =========================
 * Table Body Row
 * ========================= */
export const tableRowBase = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    width: "100%",
    height: "56px",
    borderRadius: tokens.radius.md,
    backgroundColor: rowBgColor,
    color: rowTextColor,
    boxShadow: rowShadow,
    boxSizing: "border-box",
    marginBlock: tokens.space.xs,
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

/* =========================
 * Cell Text
 * ========================= */
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

/* =========================
 * Header Cell (個別の背景・影を削除し、親trと一体化)
 * ========================= */
export const thBase = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    height: "100%",
    paddingInline: tokens.space.lg,
    color: tokens.color.text.base,
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    boxSizing: "border-box",
  },
]);

export const thAlignVariants = styleVariants({
  left: { justifyContent: "flex-start" },
  center: { justifyContent: "center" },
  right: { justifyContent: "flex-end" },
});

/* =========================
 * Body Cell
 * ========================= */
export const tdBase = style({
  display: "flex",
  alignItems: "center",
  height: "100%",
  paddingInline: tokens.space.lg,
  color: "inherit",
  fontSize: tokens.font.size.md,
  fontWeight: tokens.font.weight.medium,
  boxSizing: "border-box",
});

export const tdAlignVariants = styleVariants({
  left: { justifyContent: "flex-start" },
  center: { justifyContent: "center" },
  right: { justifyContent: "flex-end" },
});
