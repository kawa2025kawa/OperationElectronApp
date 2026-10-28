// src/renderer/features/spreadSheet/tantou/modal/TantouDetailContent.css.ts

import { style } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

const detailRowBase = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 16px",
  boxSizing: "border-box" as const,
};

export const container = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: 0,
  gap: tokens.space.md,
});

export const tabBar = style({
  display: "flex",
  width: "100%",
  flexShrink: 0,
  boxSizing: "border-box",
  gap: "4px",
  padding: "6px",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.lg,
  boxShadow: tokens.shadow.pressed.md,
});

export const tabButton = style([
  themeTransition,
  {
    flex: 1,
    minWidth: 0,
    padding: "8px 12px",
    border: "none",
    borderRadius: tokens.radius.sm,
    backgroundColor: "transparent",
    color: tokens.color.text.base,
    fontSize: "15px",
    fontWeight: tokens.font.weight.bold,
    whiteSpace: "nowrap",
    cursor: "pointer",
    outline: "none",
    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
      },
      '&[data-active="true"]': {
        backgroundColor: tokens.color.bg.base,
        color: tokens.color.accent.base,
        boxShadow: tokens.shadow.raised.md,
      },
    },
  },
]);

export const listContainer = style({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  gap: tokens.space.md,
  padding: "4px",
  boxSizing: "border-box",
});

export const detailList = style({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  width: "100%",
});

export const detailRow = style([
  themeTransition,
  detailRowBase,
  {
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.low,
    selectors: {
      "&:hover": {
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
        color: tokens.color.text.hover,
      },
    },
  },
]);

export const fieldLabel = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  flexShrink: 0,
  boxSizing: "border-box",
  width: "120px",
  height: "36px",
  paddingLeft: "16px",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.sm,
  boxShadow: tokens.shadow.pressed.md,
  color: tokens.color.accent.base,
  fontSize: "15px",
  fontWeight: tokens.font.weight.bold,
});

export const fieldValueContainer = style({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  flex: 1,
  minWidth: 0,
});

export const fieldValue = style({
  overflow: "hidden",
  color: tokens.color.text.base,
  fontSize: tokens.font.fluid.md,
  fontWeight: tokens.font.weight.bold,
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  transition: tokens.transition.fast,
  selectors: {
    [`${detailRow}:hover &`]: {
      color: tokens.color.text.hover,
    },
  },
});
