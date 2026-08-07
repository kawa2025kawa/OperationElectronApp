import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

export const closeButton = style({
  width: "32px",
  height: "32px",
  borderRadius: tokens.radius.full,
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.2rem",
  lineHeight: 1,
  transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}, color ${tokens.transition.ease}, opacity ${tokens.transition.fast}`,
  flexShrink: 0,
  outline: "none",
  color: tokens.color.text.base,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.raised.md,

  selectors: {
    "&:hover": {
      color: tokens.color.text.hover,
      boxShadow: tokens.shadow.glow.cyan,
    },
    "&:active": {
      boxShadow: tokens.shadow.pressed.low,
      transform: "scale(0.95)",
    },
  },
});
