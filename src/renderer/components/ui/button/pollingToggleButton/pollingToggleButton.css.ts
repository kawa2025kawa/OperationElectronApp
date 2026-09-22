// src/renderer/components/ui/button/pollingToggleButton/pollingToggleButton.css.ts

import { keyframes, style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

const pulseAnimation = keyframes({
  "0%": {
    boxShadow: "0 0 0 0 rgba(0, 240, 255, 0.7)",
  },
  "70%": {
    boxShadow: "0 0 0 6px rgba(0, 240, 255, 0)",
  },
  "100%": {
    boxShadow: "0 0 0 0 rgba(0, 240, 255, 0)",
  },
});

export const button = style({
  position: "relative",
  width: "13rem",
  height: "3rem",
  boxSizing: "border-box",
  padding: `0 ${tokens.space.md}`,
  border: "1px solid transparent",
  outline: "none",
  borderRadius: tokens.radius.full,
  cursor: "pointer",
  whiteSpace: "nowrap",
  overflow: "hidden",

  fontSize: tokens.font.size.md,
  fontWeight: tokens.font.weight.bold,

  transitionProperty:
    "background-color, border-color, color, box-shadow, transform",
  transitionDuration: tokens.transition.ease,
  transitionTimingFunction: "ease-in-out",

  backgroundColor: tokens.color.bg.base,
  color: tokens.color.text.base,
  boxShadow: tokens.shadow.raised.md,

  selectors: {
    "&:hover": {
      boxShadow: tokens.shadow.glow.cyan,
    },

    "&[aria-pressed='true']": {
      borderColor: "rgba(0, 240, 255, 0.4)",
      boxShadow: `${tokens.shadow.glow.cyan}, inset 0 0 0.75rem rgba(0, 240, 255, 0.15)`,
      backgroundImage: tokens.gradient.brand,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
      WebkitTextFillColor: "transparent",
    },
  },
});

export const content = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.75rem",
  width: "100%",
  height: "100%",
});

export const indicatorContainer = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1em",
  height: "1em",
  flexShrink: 0,
});

export const onlineDot = style({
  display: "block",
  width: "0.6em",
  height: "0.6em",
  borderRadius: "50%",
  backgroundColor: "#00f0ff",
  boxShadow: "0 0 8px #00f0ff",
  animation: `${pulseAnimation} 2s infinite`,
});

export const offlineDot = style({
  display: "block",
  width: "0.5em",
  height: "0.5em",
  borderRadius: "50%",
  backgroundColor: tokens.color.text.base ?? "#666",
  opacity: 0.5,
});

export const label = style({
  letterSpacing: "0.05em",
  lineHeight: 1.2,
});
