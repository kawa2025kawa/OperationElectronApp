// src/renderer/components/layout/navbar/components/hamburgerButton/hamburgerButton.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

export const button = style({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-around",
  alignItems: "center",
  width: "45px",
  height: "45px",
  backgroundColor: tokens.color.bg.surface,
  border: `1px solid ${tokens.color.border.default}`,
  borderRadius: tokens.radius.full,
  cursor: "pointer",
  padding: tokens.space.sm,
  zIndex: tokens.zIndex.content,
  boxShadow: tokens.shadow.raised.low,
  transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,
  color: tokens.color.text.base,

  selectors: {
    "&:hover": {
      color: tokens.color.text.hover,
      boxShadow: tokens.shadow.glow.cyan,
    },
  },
});

export const line = style({
  width: "20px",
  height: "2px",
  backgroundColor: "currentColor",
  borderRadius: "2px",
  transition: `background-color ${tokens.transition.fast}`,
});
