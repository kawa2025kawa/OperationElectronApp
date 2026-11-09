// src/renderer/features/spreadSheet/components/table/spreadsheetTable.css.ts

import { createVar, style, styleVariants } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

const t = tokens.transition.normal;

const rowTextColor = createVar();
const rowBgColor = createVar();

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
};

// ============================================================
// Layout
// ============================================================

export const container = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  outline: "none",
  isolation: "isolate",
});

export const headerWrapper = style({
  position: "relative",
  zIndex: 10,
  flexShrink: 0,
  paddingInline: tokens.space.md,
  borderRadius: tokens.radius.md,
  boxShadow: tokens.shadow.raised.high,
  isolation: "isolate",
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
  scrollbarWidth: "thin",
  scrollbarColor: `${tokens.color.accent.neonPink} transparent`,
  isolation: "isolate",

  selectors: {
    "&::-webkit-scrollbar": {
      width: "4px",
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

// ============================================================
// Tables
// ============================================================

export const headerTable = style({
  ...commonTable,
  borderCollapse: "separate",
  borderSpacing: 0,
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.md,
});

export const bodyTable = style({
  ...commonTable,
  borderCollapse: "separate",
  borderSpacing: `0 ${tokens.space.md}`,
});

// ============================================================
// Rows
// ============================================================

export const tableRowBase = style([
  themeTransition,
  {
    position: "relative",
    height: "56px",
    backgroundColor: rowBgColor,
    color: rowTextColor,
    boxShadow: tokens.shadow.raised.low,
    isolation: "isolate",
    transform: "translateZ(0)",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    zIndex: 0,
    outline: "none",
    transition: `background-color ${t}, color ${t}`,

    // ホバー時の発光をリペイントなしの GPU 合成（opacity 遷移）で処理する擬似要素
    "::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      borderRadius: tokens.radius.md,
      boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.high}`,
      opacity: 0,
      transition: `opacity ${t}`,
      pointerEvents: "none",
      willChange: "opacity",
    },

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
        },
        zIndex: 1,
      },
      "&:hover::before": {
        opacity: 1,
      },
      "&:active": {
        vars: {
          [rowTextColor]: tokens.color.text.hover,
        },
        boxShadow: tokens.shadow.pressed.low,
      },
    },
  },

  selected: {
    vars: {
      ...defaultRowVars,
      [rowTextColor]: tokens.color.text.base,
    },
    boxShadow: tokens.shadow.pressed.low,
    zIndex: 1,
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

// ============================================================
// Header Styles
// ============================================================

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
    verticalAlign: "middle",
    selectors: rowEdgeRadius,
  },
]);

export const thCellBase = style({
  padding: 0,
  verticalAlign: "top",
  border: "none",
  backgroundColor: "transparent",
});

export const thCardSingle = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    height: "64px",
    marginInline: "3px",
    paddingInline: tokens.space.lg,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.high,
    borderTop: `1px solid ${tokens.color.border.highlight}`,
    borderLeft: `1px solid ${tokens.color.border.default}`,
    borderRight: `1px solid ${tokens.color.border.subtle}`,
    borderBottom: `1px solid ${tokens.color.border.subtle}`,
    boxSizing: "border-box",
  },
]);

export const thCardGroup = style([
  themeTransition,
  {
    marginInline: "3px",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.high,
    borderTop: `1px solid ${tokens.color.border.highlight}`,
    borderLeft: `1px solid ${tokens.color.border.default}`,
    borderRight: `1px solid ${tokens.color.border.subtle}`,
    borderBottom: `1px solid ${tokens.color.border.subtle}`,
    overflow: "hidden",
    boxSizing: "border-box",
  },
]);

export const thCardTitle = style({
  height: "32px",
  lineHeight: "32px",
  textAlign: "center",
  color: tokens.color.text.base,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  letterSpacing: "0.05em",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  paddingInline: tokens.space.sm,
});

export const thCardSubRow = style({
  display: "flex",
  width: "100%",
  height: "32px",
});

export const thCardSubCell = style({
  display: "flex",
  alignItems: "center",
  paddingInline: tokens.space.sm,
  color: tokens.color.text.base,
  fontSize: tokens.font.size.xs,
  fontWeight: tokens.font.weight.bold,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  boxSizing: "border-box",
});

export const tdBase = style({
  paddingInline: tokens.space.lg,
  color: "inherit",
  fontSize: tokens.font.size.md,
  fontWeight: tokens.font.weight.medium,
  selectors: rowEdgeRadius,
});

// ============================================================
// Alignment
// ============================================================

export const alignVariants = styleVariants({
  left: { textAlign: "left", justifyContent: "flex-start" },
  center: { textAlign: "center", justifyContent: "center" },
  right: { textAlign: "right", justifyContent: "flex-end" },
});

// ============================================================
// Cell Text & Special Styling
// ============================================================

export const cellText = style({
  display: "inline-block",
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
  transition: `color ${t}, filter ${t}`,
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
  fontWeight: tokens.font.weight.bold,
});
