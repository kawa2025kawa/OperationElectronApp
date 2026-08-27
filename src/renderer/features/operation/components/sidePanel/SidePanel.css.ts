// src/renderer/features/operation/components/sidePanel/SidePanel.css.ts

import { style, globalStyle, keyframes } from "@vanilla-extract/css";
import { tokens, themeTransition, truncateText } from "@renderer/styles/tokens";
import { contextMenuTokens } from "@renderer/styles/tokens/component/contextMenu.tokens";

/* ============================================================
 * Keyframes (垂れてくるアニメーション)
 * ============================================================ */

const slideDownAndFade = keyframes({
  "0%": {
    opacity: 0,
    transform: "translateY(-10px) scaleY(0.95)",
  },
  "100%": {
    opacity: 1,
    transform: "translateY(0) scaleY(1)",
  },
});

const slideUpAndFade = keyframes({
  "0%": {
    opacity: 1,
    transform: "translateY(0) scaleY(1)",
  },
  "100%": {
    opacity: 0,
    transform: "translateY(-10px) scaleY(0.95)",
  },
});

/* ============================================================
 * Base & Layout Containers
 * ============================================================ */

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

export const topControls = style({
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.sm,
  flexShrink: 0,
});

/* ============================================================
 * Mode Switcher
 * ============================================================ */

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
  cursor: "pointer",
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  selectors: {
    "&[data-active='true']": {
      backgroundImage: tokens.gradient.brand,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
  },
});

/* ============================================================
 * Menu Button & Dropdown
 * ============================================================ */

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
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    cursor: "pointer",
    backgroundColor: tokens.color.bg.base,
    boxShadow: tokens.shadow.raised.high,
    backgroundImage: tokens.gradient.brand,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,
    selectors: {
      "&:hover:not(:disabled)": {
        boxShadow: `${tokens.shadow.raised.low}, ${tokens.shadow.glow.brand}`,
      },
      "&:disabled": {
        opacity: 0.4,
        cursor: "not-allowed",
      },
      "&:active:not(:disabled)": {
        boxShadow: tokens.shadow.pressed.low,
        transform: "translateY(1px)",
      },
    },
  },
]);

export const menuDropdownContent = style([
  themeTransition,
  {
    width: "var(--radix-dropdown-menu-trigger-width)",
    boxSizing: "border-box",
    height: "200px",
    maxHeight: "var(--radix-dropdown-menu-content-available-height, 60vh)",
    overflowY: "auto",
    scrollbarWidth: "none",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gridTemplateRows: "repeat(2, 1fr)",
    justifyItems: "center",
    alignItems: "center",
    gap: tokens.space.xs,
    padding: tokens.space.sm,
    borderRadius: tokens.radius.lg,

    // 🎯 1. 境界線を少し明るくしてガラスの縁（エッジ）を強調
    border: `2px solid ${tokens.color.border.subtle}`,

    backgroundColor: tokens.glass.surface,
    backdropFilter: "blur(12px) saturate(180%)",
    // 🎯 3. ブラーの強度を倍増 + 彩度（saturate）と明るさ（brightness）を補正
    WebkitBackdropFilter: "blur(24px) saturate(200%) brightness(1.2)",

    boxShadow: tokens.shadow.raised.high,
    zIndex: contextMenuTokens.zIndex + 1,
    transformOrigin: "top center",

    selectors: {
      "&::-webkit-scrollbar": {
        display: "none",
      },
      "&[data-state='open']": {
        animation: `${slideDownAndFade} 200ms cubic-bezier(0.16, 1, 0.3, 1)`,
      },
      "&[data-state='closed']": {
        animation: `${slideUpAndFade} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
      },
    },
  },
]);

export const menuItem = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    minWidth: "72px",
    aspectRatio: "1 / 1",
    height: "auto",
    borderRadius: "50%",
    boxSizing: "border-box",

    padding: `${tokens.space.xs} ${tokens.space.sm}`,

    backgroundColor: tokens.color.bg.base,

    border: `2px solid ${tokens.color.text.onAccent}`,
    boxShadow: `${tokens.shadow.glow.white}, ${tokens.shadow.raised.low}`,

    // 🎯 1. ブラウザ規定の黄色いフォーカス枠を強制消去
    outline: "none",

    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text.onAccent,
    cursor: "pointer",
    textAlign: "center",
    wordBreak: "break-word",

    transition: `
      box-shadow ${tokens.transition.ease},
      border-color ${tokens.transition.ease},
      color ${tokens.transition.ease},
      transform ${tokens.transition.fast}
    `,

    selectors: {
      // 🎯 2. ホバー時およびキーボード/マウスフォーカス時にシアンへ統一
      "&:hover, &:focus, &:focus-visible": {
        borderColor: tokens.color.accent.neonCyan,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
        transform: "scale(1.05)",
        outline: "none", // 念押しで外線リングを打ち消し
      },
    },
  },
]);

/* ============================================================
 * Info List & Rows
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
    height: "3.2rem",
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
      "&[data-remarks='true']": {
        height: "auto",
        minHeight: "4.2rem",
        paddingBlock: tokens.space.md,
        alignItems: "flex-start",
      },
    },
  },
]);

globalStyle(`${row} > span:first-child`, {
  flexShrink: 0,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  whiteSpace: "nowrap",
});

export const resultValue = style([
  truncateText,
  {
    flex: 1,
    paddingLeft: tokens.space.md,
    textAlign: "right",
    selectors: {
      [`${row}[data-remarks='true'] &`]: {
        whiteSpace: "normal",
        wordBreak: "break-all",
        lineHeight: 1.6,
      },
    },
  },
]);
