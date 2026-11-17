// src/renderer/features/operation/components/modal/linkModal/linkModalContent.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import {
  interactiveGlowCard,
  textEllipsis,
} from "@renderer/styles/global/surfaces.css";

export const contentContainer = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  isolation: "isolate",
});

export const terminalSection = style({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  width: "100%",
  overflowY: "auto",
  padding: tokens.space.xs,
  isolation: "isolate",
});

export const terminalRow = style([
  interactiveGlowCard,
  {
    display: "flex",
    alignItems: "center",
    gap: tokens.space.md,
    padding: `${tokens.space.xs} ${tokens.space.sm}`,
    width: "100%",
    boxSizing: "border-box",
    border: "none",
    textAlign: "left",
    fontSize: tokens.font.fluid.md,
  },
]);

export const nonTrBadge = style({
  position: "relative",
  zIndex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: tokens.size.badgeWidth,
  minHeight: "36px",
  padding: `${tokens.space.xs} ${tokens.space.sm}`,
  boxSizing: "border-box",
  flexShrink: 0,
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.sm,
  boxShadow: tokens.shadow.pressed.md,
  color: "inherit",
  fontWeight: tokens.font.weight.bold,
  fontSize: tokens.font.size.md,
  letterSpacing: "0.5px",
  lineHeight: "1.2",
  wordBreak: "break-all",
  cursor: "pointer",
  outline: "none",
  border: "none",

  selectors: {
    "&:active": {
      boxShadow: tokens.shadow.pressed.low,
    },
  },
});

export const flexCell = style({
  position: "relative",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minWidth: 0,
  flex: 1,
});

export const cellValue = style([
  textEllipsis,
  {
    fontSize: tokens.font.fluid.md,
    fontWeight: tokens.font.weight.bold,
    color: "inherit",
    cursor: "text",
    userSelect: "text",
  },
]);
