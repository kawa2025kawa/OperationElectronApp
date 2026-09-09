// src/renderer/features/spreadSheet/components/modal/tantou/TantouModalContent.css.ts

import { style } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

const rowBaseStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 16px",
  boxSizing: "border-box" as const,
};

export const mainContainer = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: 0,
  gap: tokens.space.md,
});

export const contentContainer = style({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  gap: tokens.space.md,
  padding: "4px",
  boxSizing: "border-box",
});

export const tabContainer = style({
  display: "flex",
  width: "100%",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.lg,
  boxShadow: tokens.shadow.pressed.md,
  padding: "6px",
  flexShrink: 0,
  boxSizing: "border-box",
  gap: "4px",
});

export const button = style([
  themeTransition,
  {
    border: "none",
    cursor: "pointer",
    backgroundColor: "transparent",
    color: tokens.color.text.base,
    fontWeight: tokens.font.weight.bold,
    outline: "none",
    borderRadius: tokens.radius.md,
    padding: "8px 16px",
    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
      },
      '&[data-variant="tab"]': {
        flex: 1,
        padding: "8px 12px",
        borderRadius: tokens.radius.sm,
        fontSize: "15px",
        whiteSpace: "nowrap",
      },
      '&[data-variant="tab"][data-active="true"]': {
        backgroundColor: tokens.color.bg.base,
        color: tokens.color.accent.base,
        boxShadow: tokens.shadow.raised.md,
      },
    },
  },
]);

export const terminalSection = style({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  width: "100%",
});

export const terminalRow = style([
  themeTransition,
  rowBaseStyle,
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

export const nonTrBadge = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  width: "120px",
  height: "36px",
  paddingLeft: "16px",
  flexShrink: 0,
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.sm,
  boxShadow: tokens.shadow.pressed.md,
  color: tokens.color.accent.base,
  fontWeight: tokens.font.weight.bold,
  fontSize: "15px",
  boxSizing: "border-box",
});

export const flexCell = style({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minWidth: 0,
  flex: 1,
});

export const cellValue = style({
  fontSize: tokens.font.fluid.md,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  transition: tokens.transition.fast,
  selectors: {
    [`${terminalRow}:hover &`]: {
      color: tokens.color.text.hover,
    },
  },
});
