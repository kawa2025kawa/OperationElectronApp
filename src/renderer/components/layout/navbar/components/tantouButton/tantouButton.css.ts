// src/renderer/components/layout/navbar/components/tantouButton/tantouButton.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

export const button = style({
  padding: `${tokens.space.md} ${tokens.space.xl}`,
  minWidth: "180px",
  height: "48px",
  border: "none",
  outline: "none",
  borderRadius: tokens.radius.full,
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontSize: tokens.font.size.md,
  fontWeight: tokens.font.weight.bold,
  transition: `all ${tokens.transition.ease}`,
  backgroundColor: tokens.color.bg.base,
  color: tokens.color.text.base,
  boxShadow: tokens.shadow.raised.md,

  "@media": {
    "screen and (max-width: 768px)": {
      minWidth: "auto",
      padding: `${tokens.space.sm} ${tokens.space.lg}`,
      fontSize: tokens.font.size.sm,
      height: "40px",
    },
  },

  selectors: {
    "&:hover": {
      boxShadow: tokens.shadow.glow.cyan,
      color: tokens.color.text.hover,
    },
  },
});
