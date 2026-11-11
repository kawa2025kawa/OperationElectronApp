// src/renderer/components/ui/button/tantouButton/tantouButton.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { baseButton } from "../buttonBase.css";

const smoothGlow = "0.8s cubic-bezier(0.25, 0.8, 0.25, 1)";
const t = tokens.transition.normal;

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
    transition: `background-color ${t}, border-color ${smoothGlow}, color ${t}`,

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
        height: "40px",
      },
    },
  },
]);
