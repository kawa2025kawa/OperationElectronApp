// src/renderer/features/operation/components/modal/contents/confirmModal/confirmModalContent.css.ts
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
  gap: "2vmin",
  minHeight: 0,
});

// メインメッセージテキスト
export const mainMessage = style([
  themeTransition,
  {
    fontSize: "clamp(14px, 2.5vmin, 22px)",
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text.base,
    textAlign: "center",
    margin: 0,
    padding: "0.5vmin 0",
  },
]);

// URL表示領域（インセット凹み枠 & 中央寄せ）
export const urlDisplayBox = style([
  pressedSection,
  {
    flex: 1,
    height: "100%",
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2vmin 3vmin",
    boxSizing: "border-box",
  },
]);

// URLテキスト（見切れ防止・折り返し・スタイル統一）
export const urlText = style({
  fontSize: "clamp(12px, 2vmin, 18px)",
  fontWeight: tokens.font.weight.medium,
  color: tokens.color.accent.base,
  wordBreak: "break-all",
  textAlign: "center",
  userSelect: "all",
});
