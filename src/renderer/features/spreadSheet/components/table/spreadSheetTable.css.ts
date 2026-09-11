// src/renderer/features/spreadSheet/components/table/spreadSheetTable.css.ts

import { createVar, style, styleVariants } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

/* -------------------------------------------------------------------------- */
/* CSS Variables & Dimensions                                                 */
/* -------------------------------------------------------------------------- */

const rowTextColor = createVar();
const rowShadow = createVar();
const rowBgColor = createVar();

const cardHeight = "56px";
const rowGap = tokens.space.sm;
const rowSlotHeight = `calc(${cardHeight} + ${rowGap} * 2)`;

/* -------------------------------------------------------------------------- */
/* Layout & Scroll Containers                                                 */
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
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.md,
  boxShadow: tokens.shadow.raised.low,
});

export const headerRow = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    width: "100%",
    minHeight: cardHeight,
    boxSizing: "border-box",
  },
]);

export const bodyWrapper = style({
  position: "relative",
  zIndex: 0,
  flex: 1,
  minHeight: 0,
  overflowX: "auto",
  overflowY: "auto",
  paddingInline: tokens.space.md,
  paddingTop: tokens.space.sm,
  paddingBottom: tokens.space.md,
  scrollbarGutter: "stable",
});

export const virtualBody = style({
  position: "relative",
  width: "100%",
});

export const virtualBodyContent = style({
  position: "relative",
  width: "100%",
});

export const tableRowSlot = style({
  position: "relative",
  width: "100%",
  height: rowSlotHeight,
  paddingBlock: rowGap,
  boxSizing: "border-box",
});

/* -------------------------------------------------------------------------- */
/* Cells Common Base & Align Variants                                         */
/* -------------------------------------------------------------------------- */

const cellBase = style({
  display: "flex",
  alignItems: "center",
  height: "100%",
  paddingInline: tokens.space.lg,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  boxSizing: "border-box",
  flexShrink: 0,
});

const alignVariants = styleVariants({
  left: { justifyContent: "flex-start", textAlign: "left" },
  center: { justifyContent: "center", textAlign: "center" },
  right: { justifyContent: "flex-end", textAlign: "right" },
});

export const thAlignVariants = alignVariants;
export const tdAlignVariants = alignVariants;

export const thBase = style([
  themeTransition,
  cellBase,
  {
    color: tokens.color.text.base,
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
]);

export const tdBase = style([
  cellBase,
  {
    color: "inherit",
    fontSize: tokens.font.size.md,
    fontWeight: tokens.font.weight.medium,
  },
]);

/* -------------------------------------------------------------------------- */
/* Body Row Card & States                                                     */
/* -------------------------------------------------------------------------- */

export const tableRowBase = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    width: "100%",
    height: cardHeight,
    borderRadius: tokens.radius.md,
    backgroundColor: rowBgColor,
    color: rowTextColor,
    boxShadow: rowShadow,
    boxSizing: "border-box",
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
/* Content & Styles                                                           */
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

export const cellTextHoliday = style({
  color: tokens.color.accent.neonPink ?? "#ff4d4f",
  fontWeight: "bold",
});

export const emptyText = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: cardHeight,
  padding: tokens.space.xl,
  color: tokens.color.text.base,
  textAlign: "center",
});

export const headerGroupCell = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.low,
    fontWeight: tokens.font.weight.bold,
    fontSize: tokens.font.size.sm,
    color: tokens.color.text.base,
    boxSizing: "border-box",
    marginInline: "2px",
  },
]);
