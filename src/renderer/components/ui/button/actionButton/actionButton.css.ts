// src/renderer/components/ui/button/actionButton/actionButton.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { baseButton } from "../buttonBase.css";

const smoothGlow = "0.8s cubic-bezier(0.25, 0.8, 0.25, 1)";
const t = tokens.transition.normal;

export const actionButton = style([
  baseButton,
  {
    position: "relative",
    fontWeight: tokens.font.weight.bold,
    transition: `background-color ${t}, border-color ${smoothGlow}, color ${t}`,

    "::before": {
      content: '""',
      position: "absolute",
      inset: -1,
      borderRadius: "inherit",
      boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      opacity: 0,
      transition: `opacity ${smoothGlow}`,
      pointerEvents: "none",
    },

    selectors: {
      "&:hover:not(:disabled)::before": {
        opacity: 1,
      },
      "&[data-active='true']::before": {
        opacity: 1,
      },
    },
  },
]);

export const variants = styleVariants({
  default: {
    padding: "1.2vmin 3vmin",
    minWidth: "120px",
    minHeight: "44px",
    borderRadius: tokens.radius.md,
    fontSize: tokens.font.fluid.sm,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    border: `1px solid ${tokens.color.border.default}`,
    boxShadow: `${tokens.shadow.raised.md}, 0 4px 10px rgba(0, 0, 0, 0.4)`,

    selectors: {
      "&:hover:not(:disabled)": {
        borderColor: tokens.color.accent.neonCyan,
        color: tokens.color.text.onAccent,
      },
      "&:active:not(:disabled)": {
        boxShadow: `${tokens.shadow.pressed.md}, inset 0 2px 4px rgba(0, 0, 0, 0.5)`,
      },
    },
  },
  tab: {
    padding: "0.8vmin 2vmin",
    borderRadius: tokens.radius.md,
    fontSize: tokens.font.fluid.sm,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    opacity: 0.8,
    border: `1px solid ${tokens.color.border.subtle}`,
    boxShadow: tokens.shadow.pressed.low,

    selectors: {
      "&:hover:not(:disabled)": {
        opacity: 1,
        borderColor: tokens.color.border.default,
      },
      "&[data-active='true']": {
        opacity: 1,
        backgroundColor: tokens.color.bg.base,
        color: tokens.color.accent.neonCyan,
        borderColor: tokens.color.accent.neonCyan,
      },
    },
  },
  pill: {
    padding: "0.4vmin 1.6vmin",
    borderRadius: tokens.radius.full,
    fontSize: tokens.font.fluid.sm,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    border: `1px solid ${tokens.color.border.default}`,
    boxShadow: tokens.shadow.raised.low,

    selectors: {
      "&:hover:not(:disabled)": {
        borderColor: tokens.color.accent.neonCyan,
        color: tokens.color.accent.neonCyan,
      },
      "&:active:not(:disabled)": {
        boxShadow: tokens.shadow.pressed.md,
      },
    },
  },
});