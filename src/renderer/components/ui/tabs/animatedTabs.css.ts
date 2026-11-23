// src/renderer/components/ui/tabs/animatedTabs.css.ts

import { globalStyle, style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import {
  brandGradientTextRule,
  focusRing,
} from "@renderer/styles/global/surfaces.css";

const elevatedLayer = {
  position: "relative" as const,
  zIndex: 1,
};

export const root = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: 0,
  gap: tokens.space.md,
  isolation: "isolate",
});

export const tabBar = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  width: "100%",
  height: tokens.size.controlHeight,
  padding: tokens.space.xs,
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.pressed.high,
  boxSizing: "border-box",
  flexShrink: 0,
  isolation: "isolate",
});

export const tabSlider = style({
  position: "absolute",
  inset: 0,
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.bg.base,
  boxShadow: `${tokens.shadow.glowRaised.high}, ${tokens.shadow.pressed.low}`,
  zIndex: 0,
  transform: "translateZ(0)",
  willChange: "transform",
  pointerEvents: "none",
});

export const tabButton = style([
  focusRing,
  {
    ...elevatedLayer,
    flex: 1,
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
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text.base,
    transition: `color ${tokens.transition.fast}`,
    whiteSpace: "nowrap",

    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
      },
    },
  },
]);

export const buttonText = style({
  ...elevatedLayer,

  selectors: {
    [`${tabButton}[data-active] &`]: brandGradientTextRule,
  },
});

globalStyle(`${tabButton}[data-active] ${buttonText} *`, {
  color: "transparent",
  WebkitTextFillColor: "transparent",
});

export const panel = style({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  gap: tokens.space.md,
  padding: "4px",
  boxSizing: "border-box",
  isolation: "isolate",
  scrollbarGutter: "stable",
});