// src/renderer/features/operation/components/modal/contents/linkModal/linkModalContent.css.ts

import { style } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

// インセット（凹み）共通基調
export const pressedSection = style([
  themeTransition,
  {
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.pressed.md,
    overflow: "hidden",
    display: "flex",
    width: "100%",
  },
]);

// 全体コンテナ
export const container = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  gap: "1.5vmin",
  minHeight: 0,
});

// セクションタイトル
export const sectionTitle = style({
  fontSize: "clamp(12px, 2vmin, 16px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  textAlign: "left",
});

// リンク表示領域（インセット枠）
export const listBox = style([
  pressedSection,
  {
    flex: 1,
    height: "100%",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    gap: "1.5vmin",
    overflowY: "auto",
    padding: "2vmin",
    boxSizing: "border-box",
  },
]);

// 🎯 カード全体をクリッカブルなボタンに変更
export const linkCardButton = style([
  themeTransition,
  {
    appearance: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    width: "100%",
    padding: "1.5vmin 2vmin",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    border: `1px solid ${tokens.color.border.subtle}`,
    boxShadow: tokens.shadow.raised.md,
    cursor: "pointer",
    textAlign: "left",
    gap: "0.5vmin",
    outline: "none",
    transition: tokens.transition.fast,

    selectors: {
      "&:hover, &:focus-visible": {
        borderColor: tokens.color.accent.neonCyan,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
        transform: "translateY(-1px)",
      },
      "&:active": {
        boxShadow: tokens.shadow.pressed.low,
        transform: "translateY(0)",
      },
    },
  },
]);

// 上段：キー（項目名）
export const linkLabel = style({
  fontSize: "clamp(13px, 2vmin, 16px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.accent.neonCyan,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  width: "100%",
});

// 下段：値（パス / URL）
export const linkValue = style({
  fontSize: "clamp(11px, 1.6vmin, 14px)",
  color: tokens.color.text.base,
  opacity: 0.8,
  wordBreak: "break-all",
  lineHeight: 1.4,
  width: "100%",
  selectors: {
    [`${linkCardButton}:hover &`]: {
      color: tokens.color.text.hover,
      opacity: 1,
    },
  },
});

// NO DATA 表示領域
export const emptyContainer = style({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  height: "100%",
  minHeight: 0,
  flex: 1,
  overflow: "hidden",
});

export const emptyText = style([
  themeTransition,
  {
    fontSize: "clamp(24px, 6vmin, 64px)",
    fontWeight: tokens.font.weight.bold,
    opacity: 0.12,
    color: tokens.color.text.base,
    transform: "rotate(-6deg)",
    whiteSpace: "nowrap",
    userSelect: "none",
  },
]);
