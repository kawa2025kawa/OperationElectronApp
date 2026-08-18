// src/renderer/features/operation/components/sidePanel/SidePanel.css.ts

import { style } from "@vanilla-extract/css";
import { tokens, themeTransition, truncateText } from "@renderer/styles/tokens";
import { contextMenuTokens } from "@renderer/styles/tokens/component/contextMenu.tokens";

export const panelContainer = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
    height: "100%",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.raised.high,
    padding: tokens.space.md,
    gap: tokens.space.md,
  },
]);

/* ============================================================
 * Top Controls (Mode Toggle & Menu Button)
 * ============================================================ */

export const topControls = style({
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.sm,
  flexShrink: 0,
});

export const modeToggleContainer = style({
  position: "relative",
  display: "flex",
  height: "40px",
  padding: tokens.space.xs,
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.pressed.high,
  overflow: "hidden",
});

export const modeToggleSlider = style({
  position: "absolute",
  top: tokens.space.xs,
  left: tokens.space.xs,
  width: "calc((100% - 8px) / 3)",
  height: "calc(100% - 8px)",
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.raised.high,
  transition: `transform ${tokens.transition.ease}`,
  selectors: {
    [`${modeToggleContainer}[data-mode='operation'] &`]: {
      transform: "translateX(0%)",
    },
    [`${modeToggleContainer}[data-mode='irregular'] &`]: {
      transform: "translateX(100%)",
    },
    [`${modeToggleContainer}[data-mode='today'] &`]: {
      transform: "translateX(200%)",
    },
  },
});

export const modeToggleButton = style({
  flex: 1,
  position: "relative",
  zIndex: 1,
  padding: "0.25rem",
  border: "none",
  outline: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  lineHeight: 1.2,
  color: tokens.color.text.base,
  transition: `color ${tokens.transition.fast}`,
});

export const toggleText = style({
  display: "inline-block",
  transition: "color 240ms ease",
  selectors: {
    [`${modeToggleButton}[data-active='true'] &`]: {
      backgroundImage: tokens.gradient.brand,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      WebkitTextFillColor: "transparent",
      color: "transparent",
    },
  },
});

/* Menu Button */
export const menuButton = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "40px",
    width: "100%",
    borderRadius: tokens.radius.full,
    border: "none",
    outline: "none",
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    cursor: "pointer",
    backgroundColor: tokens.color.bg.base,
    boxShadow: tokens.shadow.raised.low,
    transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,
    selectors: {
      "&:hover:not(:disabled)": {
        boxShadow: `${tokens.shadow.raised.low}, ${tokens.shadow.glow.brand}`,
      },
      "&:disabled": {
        opacity: 0.4,
        cursor: "not-allowed",
        boxShadow: "none",
      },
      "&:active:not(:disabled)": {
        boxShadow: tokens.shadow.pressed.low,
        transform: "translateY(1px)",
      },
    },
  },
]);

export const menuButtonText = style({
  backgroundImage: tokens.gradient.brand,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  color: "transparent",
});

/* ============================================================
 * Menu Dropdown Content (statusContextMenu と同等デザイン)
 * ============================================================ */

export const menuDropdownContent = style({
  // 🎯 Trigger (Menuボタン) と同じ横幅に設定
  width: "var(--radix-dropdown-menu-trigger-width)",
  boxSizing: "border-box",

  padding: tokens.space.xs,
  borderRadius: tokens.radius.lg,
  backgroundColor: "rgba(0, 0, 0, 0.45)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "2px solid rgba(0, 0, 0, 0.6)",
  boxShadow: tokens.shadow.raised.high,
  zIndex: contextMenuTokens.zIndex + 1,
  isolation: "isolate",
  animationDuration: "150ms",
  animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
  willChange: "transform, opacity",
  display: "flex",
  flexDirection: "column",
  gap: "2px",
});

export const menuItem = style({
  appearance: "none",
  display: "flex",
  alignItems: "center",
  width: "100%",
  border: "none",
  outline: "none",
  background: "none",
  padding: `${tokens.space.sm} ${tokens.space.md}`,
  borderRadius: tokens.radius.sm,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  textAlign: "left",
  cursor: "pointer",
  transition: `
    box-shadow ${tokens.transition.ease},
    color ${tokens.transition.ease},
    background-color ${tokens.transition.ease},
    transform ${tokens.transition.fast}
  `,
  selectors: {
    "&[data-highlighted], &:hover": {
      // 🎯 透明感を強化（ほんのりシアンが乗る程度）
      backgroundColor: "rgba(0, 243, 255, 0.06)",
      color: tokens.color.text.hover,
      // 🎯 ネオン感を弱めた柔らかい内向きシャドウ
      boxShadow: "inset 0 0 8px rgba(0, 243, 255, 0.15)",
      transform: "translateX(2px)",
    },
  },
});

/* ============================================================
 * Info Section
 * ============================================================ */

export const infoList = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    gap: tokens.space.md,
  },
]);

export const row = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
    paddingInline: tokens.space.lg,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    boxShadow: tokens.shadow.raised.low,
    cursor: "default",
    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.low}`,
      },
    },
  },
]);

export const rowStandard = style([
  row,
  {
    height: "3.2rem",
  },
]);

export const rowRemarks = style([
  row,
  {
    minHeight: "4.2rem",
    paddingBlock: tokens.space.md,
    alignItems: "flex-start",
  },
]);

export const infoLabel = style({
  flexShrink: 0,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  whiteSpace: "nowrap",
});

export const resultValue = style({
  flex: 1,
  paddingLeft: tokens.space.md,
  color: "inherit",
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  textAlign: "right",
});

export const detailStandard = style([truncateText]);

export const detailRemarks = style({
  whiteSpace: "normal",
  wordBreak: "break-all",
  lineHeight: 1.6,
});
