// src/renderer/components/ui/button/actionButton/actionButton.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { baseButton } from "../buttonBase.css";

const glowTransition = tokens.transition.glow;

export const actionButton = style([
  baseButton,
  {
    position: "relative",
    fontWeight: tokens.font.weight.bold,
    transition: `border-color ${glowTransition}`,

    "::before": {
      content: '""',
      position: "absolute",
      inset: -1,
      borderRadius: "inherit",
      boxShadow: tokens.shadow.glowRaised.md,
      opacity: 0,
      transition: `opacity ${glowTransition}`,
      pointerEvents: "none",
      willChange: "opacity",
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
    minWidth: tokens.size.badgeWidth,
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