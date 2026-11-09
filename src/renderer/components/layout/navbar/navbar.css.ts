// src/renderer/components/layout/navbar/navbar.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

export const container = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    height: "80px",
    paddingInline: tokens.space.lg,
    gap: tokens.space.xl,
    backgroundColor: tokens.color.bg.base,
    boxShadow: tokens.shadow.raised.high,
    zIndex: tokens.zIndex.content,
    position: "relative",
    isolation: "isolate",
  },
]);

export const logoText = style({
  backgroundImage: tokens.gradient.brand,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  color: "transparent",
  fontSize: tokens.font.size.xl,
  fontWeight: tokens.font.weight.bold,
  letterSpacing: "1px",
  whiteSpace: "nowrap",
  flexShrink: 0,

  "@media": {
    "screen and (max-width: 850px)": {
      display: "none",
    },
  },
});

export const centerItem = style({
  flex: 1,
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  isolation: "isolate",
});

export const centerSummaryWrapper = style({
  width: "80%",
  flexShrink: 1,
  minWidth: 0,
  isolation: "isolate",

  "@media": {
    "screen and (max-width: 900px)": {
      display: "none",
    },
  },
});

export const summaryPlaceholder = style([
  centerSummaryWrapper,
  {
    height: "48px",
  },
]);

export const rightGroup = style({
  display: "flex",
  alignItems: "center",
  gap: tokens.space.md,
  flexShrink: 0,
  isolation: "isolate",
});
