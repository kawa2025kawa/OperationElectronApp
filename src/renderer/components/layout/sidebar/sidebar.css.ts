// src/renderer/components/layout/sidebar/sidebar.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { brandGradientText } from "@renderer/styles/global/surfaces.css";

const t = tokens.transition.normal;
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
  transition: `transform ${tokens.transition.ease}, background-color ${t}, border-color ${t}, box-shadow ${t}`,
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
  transition: `background-color ${t}`,
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
  transition: `background-color ${t}, color ${t}`,

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
      transition: `background-color ${tokens.transition.fast}, box-shadow ${tokens.transition.fast}`,
      outline: "none",
    },
  },
});

export const menuText = style({
  position: "relative",
  zIndex: 1,
  transition: `color ${t}`,
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
  flexShrink: 0,
  boxSizing: "border-box",
  padding: tokens.space.xl,
  borderTop: `1px solid ${tokens.color.border.subtle}`,
  marginTop: "auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: tokens.color.bg.base,
  isolation: "isolate",
  transition: `background-color ${t}, border-color ${t}`,
});

export const footerLabel = style({
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  fontSize: tokens.font.size.sm,
  userSelect: "none",
  transition: `color ${t}`,
});

export const toggleTrack = style({
  position: "relative",
  width: "44px",
  height: "22px",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.full,
  border: `1px solid ${tokens.color.border.default}`,
  boxShadow: tokens.shadow.pressed.low,
  cursor: "pointer",
  outline: "none",
  padding: 0,
  display: "block",
  flexShrink: 0,
  isolation: "isolate",
  transition: `border-color ${glowTransition}, box-shadow ${glowTransition}, background-color ${t}`,

  "::before": {
    content: '""',
    position: "absolute",
    inset: -1,
    borderRadius: tokens.radius.full,
    boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.pressed.low}`,
    opacity: 0,
    transition: `opacity ${glowTransition}`,
    pointerEvents: "none",
    willChange: "opacity",
  },

  selectors: {
    "&:hover::before, &:focus-visible::before": {
      opacity: 1,
    },
    "&:hover, &:focus-visible": {
      borderColor: tokens.color.accent.neonCyan,
    },
  },
});

export const toggleThumb = style({
  position: "relative",
  zIndex: 1,
  top: "2px",
  left: "2px",
  width: "16px",
  height: "16px",
  borderRadius: tokens.radius.full,
  display: "block",
  pointerEvents: "none",
  transition: `transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color ${t}, box-shadow ${glowTransition}`,

  selectors: {
    "&[data-state='dark']": {
      transform: "translateX(22px)",
      backgroundColor: tokens.color.accent.neonCyan,
      boxShadow: "0 0 8px rgba(0, 255, 225, 0.6)",
    },
    "&[data-state='light']": {
      transform: "translateX(0)",
      backgroundColor: tokens.color.text.base,
      boxShadow: tokens.shadow.raised.low,
    },
  },
});
