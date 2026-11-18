// src/renderer/components/ui/button/tantouButton/tantouButton.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import {
  createBeforeGlowRule,
  focusRing,
} from "@renderer/styles/global/surfaces.css";
import { baseButton } from "../buttonBase.css";

export const button = style([
  baseButton,
  focusRing,
  {
    flexDirection: "row",
    whiteSpace: "nowrap",
    width: "13rem",
    height: "3rem",
    padding: `0 ${tokens.space.lg}`,
    border: `1px solid ${tokens.color.border.default}`,
    borderRadius: tokens.radius.full,
    fontFamily: tokens.font.base,
    fontSize: tokens.font.size.md,
    fontWeight: tokens.font.weight.bold,
    letterSpacing: "0.05em",
    lineHeight: 1.2,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    boxShadow: tokens.shadow.raised.md,
    transition: `border-color ${tokens.transition.glow}, color ${tokens.transition.fast}`,

    "::before": createBeforeGlowRule(
      `${tokens.shadow.glow.cyan}, ${tokens.shadow.pressed.low}`,
      {
        borderRadius: tokens.radius.full,
        willChange: "opacity",
      },
    ),

    selectors: {
      "&:hover:not(:disabled)": {
        color: tokens.color.text.hover,
      },
      "&:hover:not(:disabled)::before": {
        opacity: 1,
      },
    },
  },
]);