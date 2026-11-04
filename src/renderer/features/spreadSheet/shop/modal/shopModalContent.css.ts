// src/renderer/features/spreadSheet/shop/modal/shopModalContent.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

const BADGE_WIDTH = "60px";

const rowBase = style({
  display: "flex",
  alignItems: "center",
  gap: tokens.space.md,
  padding: "12px 16px",
});

const gridBase = style({
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  flex: 1,
  gap: tokens.space.md,
  alignItems: "center",
});

const ellipsisStyle = {
  whiteSpace: "nowrap" as const,
  overflow: "hidden" as const,
  textOverflow: "ellipsis" as const,
};

export const mainContainer = style({
  display: "flex",
  flexDirection: "column",
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
});

export const trTabWrapper = style({
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.md,
});

export const terminalSection = style({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
});

export const terminalHeaderRow = style([
  rowBase,
  {
    paddingTop: "6px",
    paddingBottom: "6px",
    borderBottom: `1px solid ${tokens.color.border.default}`,
    marginBottom: "2px",
    fontSize: tokens.font.fluid.md,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text.hover,
  },
]);

export const terminalHeaderBadge = style({
  width: BADGE_WIDTH,
  flexShrink: 0,
  textAlign: "center",
});

export const terminalHeaderGrid = style([
  gridBase,
  {
    ...ellipsisStyle,
  },
]);

export const terminalRow = style([
  themeTransition,
  rowBase,
  {
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.low,
    fontSize: tokens.font.fluid.md,
    selectors: {
      "&:hover": {
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
        color: tokens.color.text.hover,
      },
    },
  },
]);

export const terminalBadge = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: BADGE_WIDTH,
  height: "36px",
  flexShrink: 0,
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.sm,
  boxShadow: tokens.shadow.pressed.md,
  color: tokens.color.accent.base,
  fontWeight: tokens.font.weight.bold,
  letterSpacing: "0.5px",
});

export const nonTrBadge = style([
  terminalBadge,
  {
    width: "120px",
    justifyContent: "flex-start",
    paddingLeft: "16px",
  },
]);

export const flexCell = style({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minWidth: 0,
  flex: 1,
});

export const terminalGrid = style([gridBase]);

export const cellValue = style({
  ...ellipsisStyle,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  transition: tokens.transition.fast,
  selectors: {
    [`${terminalRow}:hover &`]: {
      color: tokens.color.text.hover,
    },
  },
});

