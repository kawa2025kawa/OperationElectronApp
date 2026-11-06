// src/renderer/features/other/otherView.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

export const container = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    gap: tokens.space.md,
    padding: tokens.space.xl,
    height: "100%",
    width: "100%",
    boxSizing: "border-box",
    overflowY: "auto",
  },
]);

export const grid = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: tokens.space.lg,
  width: "100%",
});

export const card = style([
  themeTransition,
  {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.space.xl,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    boxShadow: tokens.shadow.raised.low,
    cursor: "pointer",
    minHeight: "140px",
    border: "none",
    outline: "none",

    fontSize: tokens.font.size.lg,
    fontWeight: tokens.font.weight.bold,
    textAlign: "center",
    wordBreak: "break-all",

    transition: `transform ${tokens.transition.ease}, color ${tokens.transition.fast}`,

    "::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      borderRadius: tokens.radius.lg,
      boxShadow: tokens.shadow.glow.cyan,
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