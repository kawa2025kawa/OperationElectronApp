// src/renderer/features/operation/components/modal/operationModal.css.ts

import { style } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

/* =======================================
 * 1. 共通ベーススタイル
 * ======================================= */

/** 凹み（インセット）背景の共通コンテナ */
const insetBase = style([
  themeTransition,
  {
    width: "100%",
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.bg.base,
    boxShadow: tokens.shadow.pressed.md,
    border: `1px solid ${tokens.color.border.subtle}`,
    boxSizing: "border-box",
  },
]);

/** スクロールバーの共通スタイル */
const scrollable = style({
  overflowY: "auto",
  overflowX: "hidden",
  scrollbarWidth: "thin",
  scrollbarColor: `${tokens.color.accent.base} ${tokens.color.bg.inset}`,
  selectors: {
    "&::-webkit-scrollbar": { width: "8px" },
    "&::-webkit-scrollbar-track": {
      background: tokens.color.bg.inset,
      borderRadius: tokens.radius.md,
    },
    "&::-webkit-scrollbar-thumb": {
      background: tokens.color.accent.base,
      borderRadius: tokens.radius.md,
      border: `2px solid ${tokens.color.bg.inset}`,
    },
    "&::-webkit-scrollbar-thumb:hover": {
      background: tokens.color.accent.neonCyan,
    },
  },
});

/* =======================================
 * 2. レイアウト構造
 * ======================================= */

export const container = style({
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr) auto",
  width: "100%",
  height: "100%",
  padding: "3vmin",
  gap: "2vmin",
  boxSizing: "border-box",
});

export const header = style([
  insetBase,
  {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1vmin 2vmin",
    borderRadius: tokens.radius.lg,
  },
]);

export const modalTitle = style({
  margin: 0,
  fontSize: "clamp(16px, 3vmin, 24px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
});

export const centerContent = style([
  scrollable,
  {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    minHeight: 0,
    flex: 1,
    padding: "1vmin 1.5vmin 1vmin 0",
    boxSizing: "border-box",
  },
]);

/* =======================================
 * 3. コンテンツ & コメント領域
 * ======================================= */

export const contentFlexContainer = style({
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  width: "100%",
  height: "100%",
  gap: "1.5vmin",
  minHeight: 0,
  boxSizing: "border-box",
});

export const mainMessage = style({
  fontSize: "clamp(14px, 2.2vmin, 18px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  textAlign: "center",
  margin: 0,
  padding: "0.5vmin 0",
  flexShrink: 0,
});

export const sectionTitle = style({
  fontSize: "clamp(12px, 2vmin, 16px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  textAlign: "left",
});

/** コメント表示 / リスト表示用スクロールボックス */
export const commentBox = style([
  insetBase,
  scrollable,
  {
    height: "100%",
    minHeight: 0,
    padding: "1.5vmin 2vmin",
    color: tokens.color.text.base,
    fontSize: "clamp(15px, 2vmin, 20px)",
    fontFamily: tokens.font.mono,
    lineHeight: 1.6,
    wordBreak: "break-all",
    whiteSpace: "pre-wrap",
    display: "flex",
    flexDirection: "column",
    gap: "1.5vmin",
  },
]);

export const commentBoxError = style([
  commentBox,
  {
    borderColor: tokens.color.status?.error ?? "#f87171",
    color: tokens.color.status?.error ?? "#f87171",
  },
]);

/* =======================================
 * 4. リンクカード & 空状態スタイル
 * ======================================= */

export const linkCardButton = style([
  themeTransition,
  {
    appearance: "none",
    display: "flex",
    flexDirection: "row", // ★ 縦から横並び（1行）に変更
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    padding: "1vmin 1.5vmin",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    border: `1px solid ${tokens.color.border.subtle}`,
    boxShadow: tokens.shadow.raised.md,
    cursor: "pointer",
    textAlign: "left",
    gap: "1vmin", // ラベルとURLの間隔
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

export const linkLabel = style({
  fontSize: "clamp(20px, 2.5vmin, 24px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.accent.neonCyan,
  whiteSpace: "nowrap",
  flexShrink: 0, // ★ ラベルが潰れないように設定
});

export const linkValue = style({
  fontSize: "clamp(14px, 1.6vmin, 20px)",
  color: tokens.color.text.base,
  opacity: 0.8,
  overflow: "hidden",
  textOverflow: "ellipsis", // ★ 省略記号 (...) を表示
  whiteSpace: "nowrap", // ★ 折り返さず1行に保持
  width: "100%",
  minWidth: 0, // ★ Flexbox内で省略を正常に効かせるための指定
  selectors: {
    [`${linkCardButton}:hover &`]: {
      color: tokens.color.text.hover,
      opacity: 1,
    },
  },
});

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

/* =======================================
 * 5. アクションボタン領域
 * ======================================= */

export const actionContainer = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "2vmin",
  width: "100%",
  marginTop: "auto",
  paddingTop: "1vmin",
});
