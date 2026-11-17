// src/renderer/features/other/otherView.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

import { interactiveGlowCard } from "@renderer/styles/global/surfaces.css";

export const container = style([
  {
    display: "flex",
    flexDirection: "column",
    gap: tokens.space.md,
    padding: tokens.space.xl,
    height: "100%",
    width: "100%",
    boxSizing: "border-box",
    overflowY: "auto",
    isolation: "isolate",
  },
]);

export const grid = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: tokens.space.lg,
  width: "100%",
  isolation: "isolate",
});

export const card = style([
  interactiveGlowCard,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.space.xl,
    borderRadius: tokens.radius.lg,
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
      boxShadow: tokens.shadow.glow.cyan,
    },
  },
]);
