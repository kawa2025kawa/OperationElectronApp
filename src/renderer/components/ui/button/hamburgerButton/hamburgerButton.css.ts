// src/renderer/components/ui/button/hamburgerButton/hamburgerButton.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { neonGlowButton } from "../buttonBase.css";

const smoothGlow = "0.8s cubic-bezier(0.25, 0.8, 0.25, 1)";

export const button = style([
  neonGlowButton,
  {
    flexDirection: "column",
    justifyContent: "space-around",
    width: "45px",
    height: "45px",
    borderRadius: tokens.radius.full,
    padding: tokens.space.sm,
    zIndex: tokens.zIndex.content,

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
    },
  },
]);

export const line = style({
  position: "relative",
  zIndex: 1,
  width: "20px",
  height: "2px",
  backgroundColor: "currentColor",
  borderRadius: "2px",
  transition: `background-color ${tokens.transition.fast}`,
});
