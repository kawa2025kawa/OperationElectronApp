// src/renderer/features/operation/components/modal/contents/linkModal/linkModalContent.css.ts
import { style } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

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

// 各リン行カード
export const linkRowCard = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1.5vmin 2vmin",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.md,
    transition: tokens.transition.fast,
    gap: "2vmin",
    selectors: {
      "&:hover": {
        boxShadow: tokens.shadow.glow.cyan,
        transform: "translateY(-1px)",
      },
    },
  },
]);

// リンクのラベル（左側）
export const linkLabel = style({
  fontSize: "clamp(13px, 2.2vmin, 18px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

// リンク開くボタン
export const openButton = style([
  themeTransition,
  {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1vmin 2vmin",
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.accent.base,
    fontSize: "clamp(11px, 1.8vmin, 15px)",
    fontWeight: tokens.font.weight.bold,
    border: "none",
    boxShadow: tokens.shadow.raised.md,
    cursor: "pointer",
    whiteSpace: "nowrap",
    selectors: {
      "&:hover": {
        boxShadow: tokens.shadow.glow.cyan,
        transform: "translateY(-1px)",
        color: tokens.color.text.hover,
      },
      "&:active": {
        boxShadow: tokens.shadow.pressed.low,
        transform: "translateY(0)",
      },
    },
  },
]);

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
