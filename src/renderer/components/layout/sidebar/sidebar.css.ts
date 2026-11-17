// src/renderer/components/layout/sidebar/sidebar.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { brandGradientText } from "@renderer/styles/global/surfaces.css";

const glowTransition = tokens.transition.glow;

export const sidebar = style({
  position: "fixed",
  top: 0,
  left: 0,
  width: "300px",
  height: "100%",
  maxHeight: "100vh",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.raised.high,
  borderRight: `1px solid ${tokens.color.border.subtle}`,
  zIndex: tokens.zIndex.modal,
  transform: "translateX(-100%)",
  transition: `transform ${tokens.transition.ease}`,
  isolation: "isolate",
  overflow: "hidden",
});

export const sidebarOpen = style({
  transform: "translateX(0)",
});

export const header = style({
  flexShrink: 0,
  boxSizing: "border-box",
  padding: `${tokens.space.xl} ${tokens.space.lg}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});

export const headerTitle = style([
  brandGradientText,
  {
    fontSize: tokens.font.size.xl,
    fontWeight: tokens.font.weight.bold,
    letterSpacing: "1px",
    userSelect: "none",
  },
]);

export const menuList = style({
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  boxSizing: "border-box",
  listStyle: "none",
  padding: 10,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.md,
  isolation: "isolate",
});

export const menuItem = style({
  width: "100%",
  flexShrink: 0,
  isolation: "isolate",
});

export const menuButton = style({
  position: "relative",
  width: "100%",
  boxSizing: "border-box",
  padding: tokens.space.lg,
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.md,
  color: tokens.color.text.base,
  fontSize: tokens.font.size.md,
  fontWeight: tokens.font.weight.bold,
  border: "none",
  textAlign: "left",
  boxShadow: tokens.shadow.raised.md,
  cursor: "pointer",
  outline: "none",
  isolation: "isolate",
  transition: `color ${tokens.transition.fast}`,

  "::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.glowRaised.md,
    opacity: 0,
    transition: `opacity ${glowTransition}`,
    pointerEvents: "none",
    willChange: "opacity",
  },

  selectors: {
    "&:hover": {
      color: tokens.color.text.hover,
    },
    "&:hover::before": {
      opacity: 1,
    },
    "&[data-active='true']": {
      backgroundColor: tokens.color.bg.base,
      boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.pressed.low}`,
    },
    "&:active": {
      outline: "none",
    },
  },
});

export const menuText = style({
  position: "relative",
  zIndex: 1,
  selectors: {
    [`${menuButton}[data-active='true'] &`]: {
      backgroundImage: tokens.gradient.brand,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
    },
  },
});