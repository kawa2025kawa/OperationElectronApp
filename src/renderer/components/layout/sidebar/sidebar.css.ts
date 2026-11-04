// src/renderer/components/layout/sidebar/sidebar.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

const smoothGlow = "0.8s cubic-bezier(0.25, 0.8, 0.25, 1)";
const t = tokens.transition.normal;

// ============================================================
// Sidebar Container
// ============================================================

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
  // 開閉時の横スライドとテーマ切り替え時の色フェードを両立
  transition: `transform ${tokens.transition.ease}, background-color ${t}, border-color ${t}, box-shadow ${t}`,
  isolation: "isolate",
  overflow: "hidden",
});

export const sidebarOpen = style({
  transform: "translateX(0)",
});

// ============================================================
// Header
// ============================================================

export const header = style({
  flexShrink: 0,
  boxSizing: "border-box",
  padding: `${tokens.space.xl} ${tokens.space.lg}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  transition: `background-color ${t}`,
});

export const headerTitle = style({
  backgroundImage: tokens.gradient.brand,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  color: "transparent",
  fontSize: tokens.font.size.xl,
  fontWeight: tokens.font.weight.bold,
  letterSpacing: "1px",
  userSelect: "none",
});

// ============================================================
// Menu List & Items
// ============================================================

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
  scrollbarWidth: "none",
  selectors: {
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
});

export const menuItem = style({
  width: "100%",
  flexShrink: 0,
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
  // 🎯 全体を tokens.transition.normal (0.8s) で統一
  transition: `background-color ${tokens.transition.normal}, color ${tokens.transition.normal}, box-shadow ${tokens.transition.normal}`,

  selectors: {
    "&:hover": {
      color: tokens.color.text.hover,
      boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
    },
    "&[data-active='true']": {
      backgroundColor: tokens.color.bg.base,
      boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.pressed.low}`,
    },
    // 💡 個別に素早く反応させたい箇所は fast (0.18s) で上書き可能
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

// ============================================================
// Footer & Theme Toggle
// ============================================================

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
  transition: `border-color ${smoothGlow}, box-shadow ${smoothGlow}, background-color ${t}`,

  selectors: {
    "&:hover": {
      borderColor: tokens.color.accent.neonCyan,
      boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.pressed.low}`,
    },
    "&:focus-visible": {
      borderColor: tokens.color.accent.neonCyan,
      boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.pressed.low}`,
    },
  },
});

export const toggleThumb = style({
  position: "absolute",
  top: "2px",
  left: "2px",
  width: "16px",
  height: "16px",
  borderRadius: tokens.radius.full,
  display: "block",
  pointerEvents: "none",
  transition: `transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color ${t}, box-shadow ${smoothGlow}`,

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
