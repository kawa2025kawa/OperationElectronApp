// src/renderer/components/ui/button/hamburgerButton/hamburgerButton.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { neonGlowButton } from "../buttonBase.css";

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
