// src/renderer/features/operation/components/modal/linkModal/linkModalContent.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

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
  width: "100%",
  height: "100%",
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
    position: "relative",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.low,
    fontSize: tokens.font.fluid.md,
    color: tokens.color.text.base,
    transition: `color ${tokens.transition.fast}`,

    "::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      borderRadius: tokens.radius.md,
      boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      opacity: 0,
      transition: `opacity ${tokens.transition.normal}`,
      pointerEvents: "none",
    },

    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
      },
      "&:hover::before": {
        opacity: 1,
      },
    },
  },
]);

const terminalBadge = style({
  position: "relative",
  zIndex: 1,
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
  color: "inherit", // 🎯 button の既定黒文字を打ち消し、親の文字色（ホバー連動含む）を継承
  fontWeight: tokens.font.weight.bold,
  fontSize: tokens.font.size.md,
  letterSpacing: "0.5px",
  lineHeight: "1.2",
  wordBreak: "break-all",
  cursor: "pointer",
  outline: "none",
  border: "none",
  transition: `color ${tokens.transition.fast}`,

  selectors: {
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
  position: "relative",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minWidth: 0,
  flex: 1,
});

export const cellValue = style({
  fontSize: tokens.font.fluid.md,
  fontWeight: tokens.font.weight.bold,
  color: "inherit",
  cursor: "text",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  userSelect: "text",
  transition: tokens.transition.fast,
});
