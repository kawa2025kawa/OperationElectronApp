// src/renderer/components/ui/toggle/segmentedControl.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { focusRing } from "@renderer/styles/global/surfaces.css";

const t = tokens.transition.normal;

export const containerBase = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  padding: tokens.space.xs,
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.pressed.high,
  boxSizing: "border-box",
  isolation: "isolate",
});

export const containerSize = styleVariants({
  sm: { height: "32px" },
  md: { height: tokens.size.controlHeight },
  lg: { height: "48px" },
});

export const containerWidth = styleVariants({
  full: { width: "100%" },
  auto: { width: "auto" },
});

export const track = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  width: "100%",
  height: "100%",
});

export const slider = style({
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.glowRaised.high,
  zIndex: 0,
  pointerEvents: "none",
  willChange: "transform",
  transition: "transform 0.24s cubic-bezier(0.22, 1, 0.36, 1)",
});

export const itemButtonBase = style([
  focusRing,
  {
    flex: 1,
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "0 0.75rem",
    border: "none",
    borderRadius: tokens.radius.full,
    outline: "none",
    cursor: "pointer",
    backgroundColor: "transparent",
    fontFamily: tokens.font.base,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text.base,
    transition: `color ${t}`,
    whiteSpace: "nowrap",

    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
      },
    },
  },
]);

export const itemButtonSize = styleVariants({
  sm: { fontSize: tokens.font.size.xs },
  md: { fontSize: tokens.font.size.sm },
  lg: { fontSize: tokens.font.size.md },
});

export const itemText = style({
  position: "relative",
  zIndex: 1,
  transition: `color ${t}`,

  selectors: {
    '&[data-active="true"]': {
      backgroundImage: tokens.gradient.brand,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
    },
  },
});
