// src/renderer/features/spreadSheet/components/modal/shop/shopModalContent.css.ts

import { style } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

export const modalContainer = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  width: "100%",
  padding: tokens.space.xl,
  boxSizing: "border-box",
  gap: tokens.space.lg,
  fontFamily: tokens.font.base,
  overflow: "hidden",
});

export const header = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingBottom: tokens.space.md,
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
  /* 影（box-shadow）が切れずに浮き出るように上下左右に十分な内側余白を確保 */
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
  gap: "16px", // 🎯 各カード間にハッキリとした隙間（余白）を設置
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
    padding: "16px 20px", // 🎯 上下左右の内側余白を強化
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    /* 🎯 影を強調（立体的な浮き上がり） */
    boxShadow: tokens.shadow.raised.md,
    boxSizing: "border-box",
    height: "100%",
    minHeight: 0,

    selectors: {
      "&:hover": {
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.high}`,
      },
      '&[data-full-width="true"]': {
        gridColumn: "1 / -1",
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
