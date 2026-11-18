// src/renderer/components/layout/footer/components/footerActionButton.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import {
  createBeforeGlowRule,
  focusRing,
} from "@renderer/styles/global/surfaces.css";

export const actionButton = style([
  focusRing,
  {
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
    transition: `border-color ${tokens.transition.glow}`,

    "::before": createBeforeGlowRule(
      `${tokens.shadow.glow.cyan}, ${tokens.shadow.pressed.low}`,
      {
        borderRadius: tokens.radius.full,
        willChange: "opacity",
      },
    ),

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
    },
  },
]);

export const actionButtonText = style({
  position: "relative",
  zIndex: 1,
  fontSize: tokens.font.size.xs,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,

  selectors: {
    [`${actionButton}[data-pressed] &`]: {
      color: tokens.color.accent.base,
    },
  },
});