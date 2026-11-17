// src/renderer/components/ui/button/tantouButton/tantouButton.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { baseButton } from "../buttonBase.css";

const t = tokens.transition.normal;
const glowTransition = tokens.transition.glow;

export const button = style([
  baseButton,
  {
    padding: `${tokens.space.md} ${tokens.space.xl}`,
    minWidth: "180px",
    height: "48px",
    borderRadius: tokens.radius.full,
    whiteSpace: "nowrap",
    fontFamily: tokens.font.base,
    fontSize: tokens.font.size.md,
    fontWeight: tokens.font.weight.bold,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    border: `1px solid ${tokens.color.border.default}`,
    boxShadow: tokens.shadow.raised.md,
    transition: `background-color ${t}, border-color ${glowTransition}, color ${t}`,

    "::before": {
      content: '""',
      position: "absolute",
      inset: -1,
      borderRadius: tokens.radius.full,
      boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.pressed.low}`,
      opacity: 0,
      transition: `opacity ${glowTransition}`,
      pointerEvents: "none",
      willChange: "opacity",
    },

    selectors: {
      "&:hover:not(:disabled)": {
        color: tokens.color.text.hover,
      },
      "&:hover:not(:disabled)::before": {
        opacity: 1,
      },
    },

    "@media": {
      "screen and (max-width: 768px)": {
        minWidth: "auto",
        padding: `${tokens.space.sm} ${tokens.space.lg}`,
        fontSize: tokens.font.size.sm,
        height: tokens.size.controlHeight,
      },
    },
  },
]);
