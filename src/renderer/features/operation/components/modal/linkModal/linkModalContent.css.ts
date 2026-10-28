// src/renderer/features/operation/components/modal/linkModal/linkModalContent.css.ts

import { style } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

const BADGE_WIDTH = "120px";

/* ============================================================
 * Base Styles
 * ============================================================ */

const rowBaseStyle = style({
  display: "flex",
  alignItems: "center",
  gap: tokens.space.md,
  padding: `${tokens.space.xs} ${tokens.space.sm}`,
  width: "100%",
  boxSizing: "border-box",
  border: "none",
  textAlign: "left",
});

/* ============================================================
 * Container & Layouts
 * ============================================================ */

export const contentContainer = style({
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.md,
  width: "100%",
  height: "100%",
});

export const sectionTitle = style({
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
});

export const terminalSection = style({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  width: "100%",
  overflowY: "auto",
  padding: tokens.space.xs,
});

/* ============================================================
 * Row & Cell Styles
 * ============================================================ */

export const terminalRow = style([
  rowBaseStyle,
  themeTransition,
  {
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.low,
  },
]);

const terminalBadge = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: BADGE_WIDTH,
  minHeight: "36px",
  height: "auto",
  padding: `${tokens.space.xs} ${tokens.space.sm}`,
  flexShrink: 0,
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.sm,
  boxShadow: tokens.shadow.pressed.md,
  color: tokens.color.accent.base,
  fontWeight: tokens.font.weight.bold,
  fontSize: tokens.font.size.md,
  letterSpacing: "0.5px",
  lineHeight: "1.2",
  wordBreak: "break-all",
  cursor: "pointer",
  selectors: {
    "&:hover, &:focus-visible": {
      boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,

      outline: "none",
    },
    "&:active": {
      boxShadow: tokens.shadow.pressed.low,
    },
  },
});

export const nonTrBadge = style([
  terminalBadge,
  {
    boxSizing: "border-box",
  },
]);

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
  cursor: "text",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  userSelect: "text",
  transition: tokens.transition.fast,
  selectors: {
    [`${terminalRow}:hover &`]: {
      color: tokens.color.text.hover,
    },
  },
});
