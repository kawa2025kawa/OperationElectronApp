// src/renderer/components/layout/footer/components/footerActionButton.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

const smoothGlow = "0.8s cubic-bezier(0.25, 0.8, 0.25, 1)";
const t = tokens.transition.normal;

export const actionButton = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "42px",
  height: "42px",
  borderRadius: tokens.radius.full,
  border: `1px solid ${tokens.color.border.default}`,
  outline: "none",
  cursor: "pointer",
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.raised.md,
  isolation: "isolate",
  transform: "translateZ(0)",
  transition: `background-color ${t}, border-color ${smoothGlow}, box-shadow ${t}`,

  "::before": {
    content: '""',
    position: "absolute",
    inset: -1,
    borderRadius: tokens.radius.full,
    boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.pressed.low}`,
    opacity: 0,
    transition: `opacity ${smoothGlow}`,
    pointerEvents: "none",
    willChange: "opacity",
  },

  selectors: {
    "&:hover::before": {
      opacity: 1,
    },
    "&[data-pressed]": {
      borderColor: tokens.color.border.accent,
    },
    "&[data-pressed]::before": {
      opacity: 1,
    },
    "&:focus-visible": {
      outline: `2px solid ${tokens.color.accent.neonCyan}`,
      outlineOffset: "2px",
    },
  },
});

export const actionButtonText = style({
  position: "relative",
  zIndex: 1,
  fontSize: tokens.font.size.xs,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  transition: `color ${t}`,

  selectors: {
    [`${actionButton}[data-pressed] &`]: {
      color: tokens.color.accent.base,
    },
  },
});
