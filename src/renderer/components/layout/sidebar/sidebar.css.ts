// src/renderer/components/layout/sidebar/sidebar.css.ts

import { style } from "@vanilla-extract/css";
import { tokens, brandGradientText, titleText } from "@renderer/styles/tokens";

export const sidebar = style({
  position: "fixed",
  top: 0,
  left: 0,
  width: "300px",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.raised.high,
  borderRight: `1px solid ${tokens.color.border.subtle}`,
  zIndex: tokens.zIndex.modal,
  transform: "translateX(-100%)",
  transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,
  isolation: "isolate",
});

export const sidebarOpen = style({
  transform: "translateX(0)",
});

export const header = style({
  padding: `${tokens.space.xl} ${tokens.space.lg}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});

export const headerTitle = style([
  brandGradientText,
  titleText,
  {
    fontSize: tokens.font.size.xl,
  },
]);

export const menuList = style({
  listStyle: "none",
  padding: 10,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.md,
});

export const menuItem = style({
  width: "100%",
});

export const menuButton = style({
  width: "100%",
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
  transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,
  selectors: {
    "&:hover": {
      color: tokens.color.text.hover,
      boxShadow: tokens.shadow.glow.cyan,
    },
    "&:active": {
      boxShadow: tokens.shadow.pressed.low,
    },
    "&[data-active='true']": {
      backgroundColor: tokens.color.bg.base,
      boxShadow: tokens.shadow.pressed.low,
    },
  },
});

export const menuText = style({
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

export const sidebarFooter = style({
  padding: tokens.space.xl,
  borderTop: `1px solid ${tokens.color.border.subtle}`,
  marginTop: "auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});

export const footerLabel = style({
  fontWeight: "bold",
  color: tokens.color.text.base,
});

export const toggleTrack = style({
  width: "44px",
  height: "22px",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.full,
  position: "relative",
  cursor: "pointer",
});

export const toggleThumb = style({
  width: "16px",
  height: "16px",
  borderRadius: tokens.radius.full,
  position: "absolute",
  top: "3px",
  transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,
  selectors: {
    "&[data-state='dark']": {
      right: "3px",
      backgroundColor: tokens.color.accent.neonCyan,
      boxShadow: tokens.shadow.glow.cyan,
    },
    "&[data-state='light']": {
      left: "3px",
      backgroundColor: tokens.color.text.base,
    },
  },
});
