// src/renderer/features/spreadSheet/components/modal/tantou/tantouModalContent.css.ts

import { style } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

export const modalContainer = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  width: "100%",
  padding: tokens.space.xl,
  boxSizing: "border-box",
  gap: tokens.space.md,
  fontFamily: tokens.font.base,
  overflow: "hidden",
});

export const header = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingBottom: tokens.space.sm,
  borderBottom: `1px solid ${tokens.color.border.subtle}`,
  flexShrink: 0,
});

export const modalTitle = style({
  margin: 0,
  fontSize: tokens.font.size.lg,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.hover,
});

export const tabContainer = style({
  display: "flex",
  width: "100%",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.lg,
  boxShadow: tokens.shadow.pressed.md,
  padding: "8px",
  flexShrink: 0,
  boxSizing: "border-box",
  gap: "4px",
});

export const contentContainer = style({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  height: "100%",
  minHeight: 0,
  overflowY: "auto",
  /* 🎯 左右・上下にしっかり12pxの余白を設けて影切れを防ぎ、スクロールバーとの隙間を作る */
  padding: "12px",
  boxSizing: "border-box",
});

export const footer = style({
  display: "flex",
  justifyContent: "flex-end",
  gap: tokens.space.sm,
  paddingTop: tokens.space.md,
  borderTop: `1px solid ${tokens.color.border.subtle}`,
  flexShrink: 0,
});

export const button = style([
  themeTransition,
  {
    border: "none",
    cursor: "pointer",
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    fontWeight: tokens.font.weight.bold,
    outline: "none",
    boxShadow: tokens.shadow.raised.low,
    padding: "8px 16px",
    borderRadius: tokens.radius.md,

    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
        boxShadow: tokens.shadow.glow.cyan,
      },
      "&:active": {
        boxShadow: tokens.shadow.pressed.low,
      },
      '&[data-variant="tab"]': {
        flex: 1,
        padding: "10px 16px",
        borderRadius: tokens.radius.sm,
        backgroundColor: "transparent",
        fontSize: "clamp(12px, 1.8vmin, 15px)",
        whiteSpace: "nowrap",
        boxShadow: "none",
      },
      '&[data-variant="tab"][data-active="true"]': {
        backgroundColor: tokens.color.bg.base,
        color: tokens.color.accent.base,
        boxShadow: tokens.shadow.raised.md,
      },
    },
  },
]);

export const gridContainer = style({
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gridAutoRows: "1fr",
  gap: "16px", // 🎯 カード間のマージンを均等に確保
  width: "100%",
  height: "100%",
  minHeight: 0,
  boxSizing: "border-box",
});

export const card = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "16px 20px",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.md, // 🎯 立体感のあるシャドウ設定
    boxSizing: "border-box",
    height: "100%",
    minHeight: 0,

    selectors: {
      "&:hover": {
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.high}`,
        transform: "translateY(-1px)",
      },
    },
  },
]);

export const label = style({
  fontSize: "clamp(12px, 1.8vmin, 15px)",
  fontWeight: tokens.font.weight.medium,
  color: tokens.color.text.base,
  opacity: 0.7,
  marginBottom: "8px",
  transition: `color ${tokens.transition.ease}, opacity ${tokens.transition.ease}`,

  selectors: {
    [`${card}:hover &`]: {
      color: tokens.color.text.hover,
      opacity: 1,
    },
  },
});

export const value = style({
  fontSize: "clamp(14px, 2.2vmin, 20px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  wordBreak: "break-all",
  textAlign: "center",
  transition: `color ${tokens.transition.ease}`,

  selectors: {
    [`${card}:hover &`]: {
      color: tokens.color.text.hover,
    },
  },
});
