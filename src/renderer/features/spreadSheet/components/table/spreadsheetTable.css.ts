// src/renderer/features/spreadSheet/components/table/spreadSheetTable.css.ts

import { createVar, style, styleVariants } from "@vanilla-extract/css";

import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

const rowTextColor = createVar();
const rowBgColor = createVar();

const defaultRowVars = {
  [rowBgColor]: tokens.color.bg.base,
  [rowTextColor]: tokens.color.text.base,
};

const commonTable = {
  width: "100%",
  minWidth: "100%",
  tableLayout: "fixed",
  borderCollapse: "separate",
} satisfies Parameters<typeof style>[0];

const headerTextStyle = {
  color: tokens.color.text.base,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
} satisfies Parameters<typeof style>[0];

const headerCardBase = {
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.md,
  boxShadow: tokens.shadow.raised.high,
  borderTop: `1px solid ${tokens.color.border.highlight}`,
  borderLeft: `1px solid ${tokens.color.border.default}`,
  borderRight: `1px solid ${tokens.color.border.subtle}`,
  borderBottom: `1px solid ${tokens.color.border.subtle}`,
  boxSizing: "border-box",
} satisfies Parameters<typeof style>[0];

const scrollbar = {
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
} satisfies Parameters<typeof style>[0];

export const container = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
  outline: "none",
  isolation: "isolate",
});

export const headerWrapper = style({
  position: "relative",
  zIndex: 2,
  flexShrink: 0,
  width: "100%",
  overflow: "hidden",
  paddingInline: tokens.space.md,
  paddingTop: tokens.space.sm,
  scrollbarGutter: "stable",
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.raised.high,
});

export const bodyWrapper = style({
  position: "relative",
  zIndex: 0,
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  paddingInline: tokens.space.md,
  scrollbarGutter: "stable",
  ...scrollbar,
});

export const table = style({
  ...commonTable,
  borderSpacing: `0 ${tokens.space.md}`,
});

export const headerTable = style({
  ...commonTable,
  borderSpacing: 0,
});

export const tableHeader = style({
  backgroundColor: tokens.color.bg.base,
});

export const tableRowBase = style([
  themeTransition,
  {
    height: "56px",
    backgroundColor: rowBgColor,
    color: rowTextColor,
    boxShadow: tokens.shadow.raised.low,
    outline: "none",
    transition: `background-color ${tokens.transition.normal}, color ${tokens.transition.normal}, box-shadow ${tokens.transition.normal}`,
  },
]);

export const tableRowStates = styleVariants({
  idle: {
    vars: defaultRowVars,
  },
  clickable: {
    vars: defaultRowVars,
    cursor: "pointer",
    selectors: {
      "&:hover": {
        vars: { [rowTextColor]: tokens.color.text.hover },
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.high}`,
        zIndex: 1,
      },
      "&:active": {
        vars: { [rowTextColor]: tokens.color.text.hover },
        boxShadow: tokens.shadow.pressed.low,
      },
    },
  },
});

export const thCellBase = style({
  padding: 0,
  verticalAlign: "top",
  border: "none",
  borderBottom: `1px solid ${tokens.color.border.subtle}`,
  backgroundColor: tokens.color.bg.base,
});

export const thPlaceholderContent = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "64px",
  boxSizing: "border-box",
});

export const thCardSingle = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    minWidth: 0,
    height: "64px",
    marginInline: "3px",
    paddingInline: tokens.space.lg,
    ...headerCardBase,
    ...headerTextStyle,
  },
]);

export const thCardGroup = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "64px",
    minWidth: 0,
    overflow: "hidden",
    ...headerCardBase,
  },
]);

export const thCardGroupTop = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "30px",
  flexShrink: 0,
  paddingInline: tokens.space.md,
  borderBottom: `1px solid ${tokens.color.border.default}`,
  ...headerTextStyle,
});

export const thCardSubRow = style({
  display: "flex",
  flex: 1,
  width: "100%",
  minWidth: 0,
  overflow: "hidden",
});

export const thCardSubCell = style({
  display: "flex",
  alignItems: "center",
  minWidth: 0,
  paddingInline: tokens.space.lg,
  boxSizing: "border-box",
  ...headerTextStyle,
});

export const thRowCard = style({});

export const thCellStandard = style({
  height: "64px",
  paddingInline: tokens.space.lg,
  backgroundColor: tokens.color.bg.base,
  borderTop: `1px solid ${tokens.color.border.highlight}`,
  borderBottom: `1px solid ${tokens.color.border.subtle}`,
  boxSizing: "border-box",
  verticalAlign: "middle",
  ...headerTextStyle,

  selectors: {
    [`${thRowCard} &:first-child`]: {
      borderLeft: `1px solid ${tokens.color.border.default}`,
      borderTopLeftRadius: tokens.radius.md,
      borderBottomLeftRadius: tokens.radius.md,
    },
    [`${thRowCard} &:last-child`]: {
      borderRight: `1px solid ${tokens.color.border.subtle}`,
      borderTopRightRadius: tokens.radius.md,
      borderBottomRightRadius: tokens.radius.md,
    },
  },
});

export const dayTone = styleVariants({
  saturday: { color: "#3b9eff" },
  holiday: { color: "#ff4d4f" },
});

export const tdBase = style({
  paddingInline: tokens.space.lg,
  color: "inherit",
  fontSize: tokens.font.size.md,
  fontWeight: tokens.font.weight.medium,
  selectors: {
    "tr > &:first-child": {
      borderRadius: `${tokens.radius.md} 0 0 ${tokens.radius.md}`,
    },
    "tr > &:last-child": {
      borderRadius: `0 ${tokens.radius.md} ${tokens.radius.md} 0`,
    },
  },
});

export const alignVariants = styleVariants({
  left: { textAlign: "left", justifyContent: "flex-start" },
  center: { textAlign: "center", justifyContent: "center" },
  right: { textAlign: "right", justifyContent: "flex-end" },
});

export const cellText = style({
  display: "inline-block",
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
  transition: `color ${tokens.transition.normal}, filter ${tokens.transition.normal}`,
});

export const cellTextHoliday = style({
  color: tokens.color.accent.neonPink ?? "#ff4d4f",
  fontWeight: tokens.font.weight.bold,
});
