// src/renderer/features/spreadSheet/components/table/spreadSheetTable.css.ts

import { style, styleVariants } from "@vanilla-extract/css";

import { tokens } from "@renderer/styles/tokens/semantic.contract";

import { textEllipsis } from "@renderer/styles/global/surfaces.css";

const t = tokens.transition.normal;

const commonTable = {
  width: "100%",
  minWidth: "100%",
  tableLayout: "fixed" as const,
  borderCollapse: "separate" as const,
};

const headerTextStyle = {
  color: tokens.color.text.base,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  whiteSpace: "nowrap" as const,
  overflow: "hidden" as const,
  textOverflow: "ellipsis" as const,
};

const headerCardBase = {
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.md,
  boxShadow: tokens.shadow.raised.high,
  borderTop: `1px solid ${tokens.color.border.highlight}`,
  borderLeft: `1px solid ${tokens.color.border.default}`,
  borderRight: `1px solid ${tokens.color.border.subtle}`,
  borderBottom: `1px solid ${tokens.color.border.subtle}`,
  boxSizing: "border-box" as const,
};

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

export const bodyWrapper = style([
  {
    position: "relative",
    zIndex: 0,
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    paddingInline: tokens.space.md,
    scrollbarGutter: "stable",
  },
]);

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

export const tableRowBase = style({
  height: tokens.size.tableRowHeight,
  backgroundColor: tokens.color.bg.base,
  color: tokens.color.text.base,
  boxShadow: tokens.shadow.raised.low,
  outline: "none",
  transition: `background-color ${t}, color ${t}, box-shadow ${t}`,
});

export const tableRowStates = styleVariants({
  idle: {},
  clickable: {
    cursor: "pointer",
    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
        boxShadow: tokens.shadow.glowRaised.high,
      },
      "&:active": {
        color: tokens.color.text.hover,
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
  height: tokens.size.tableHeaderGroupHeight,
  boxSizing: "border-box",
});

export const thCardSingle = style({
  display: "flex",
  alignItems: "center",
  minWidth: 0,
  height: tokens.size.tableHeaderGroupHeight,
  marginInline: "3px",
  paddingInline: tokens.space.lg,
  ...headerCardBase,
  ...headerTextStyle,
});

export const thCardGroup = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: tokens.size.tableHeaderGroupHeight,
  minWidth: 0,
  overflow: "hidden",
  ...headerCardBase,
});

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
  height: tokens.size.tableHeaderGroupHeight,
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
  saturday: { color: tokens.color.calendar.saturday },
  holiday: { color: tokens.color.calendar.holiday },
});

export const tdBase = style({
  paddingInline: tokens.space.lg,
  color: "inherit",
  fontSize: tokens.font.size.md,
  fontWeight: tokens.font.weight.medium,
  selectors: {
    "&:first-child": {
      borderRadius: `${tokens.radius.md} 0 0 ${tokens.radius.md}`,
    },
    "&:last-child": {
      borderRadius: `0 ${tokens.radius.md} ${tokens.radius.md} 0`,
    },
  },
});

export const alignVariants = styleVariants({
  left: { textAlign: "left", justifyContent: "flex-start" },
  center: { textAlign: "center", justifyContent: "center" },
  right: { textAlign: "right", justifyContent: "flex-end" },
});

export const cellText = style([
  textEllipsis,
  {
    display: "inline-block",
    maxWidth: "100%",
    verticalAlign: "middle",
    transition: `color ${t}, filter ${t}`,
  },
]);

export const cellTextHoliday = style({
  color: tokens.color.accent.neonPink,
  fontWeight: tokens.font.weight.bold,
});
