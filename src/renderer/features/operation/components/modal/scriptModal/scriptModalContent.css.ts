// electron/features/operation/components/modal/scriptModal/scriptModalContent.css.ts

import { style } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

/* =======================================
 * 共通ベーススタイル（凹み・スクロール）
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
 * レイアウト構造
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

/* =======================================
 * 上部：メッセージ枠（凹み）
 * ======================================= */

export const messageContainer = style([
  insetBase,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1vmin 2vmin",
    flexShrink: 0,
  },
]);

export const mainMessage = style({
  fontSize: tokens.font.fluid.md,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  textAlign: "center",
  margin: 0,
});

/* =======================================
 * 下部：コメント・ドロップゾーン枠（凹み）
 * ======================================= */

export const bottomArea = style({
  width: "100%",
  height: "100%",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
});

export const commentBox = style([
  insetBase,
  scrollable,
  {
    height: "100%",
    minHeight: 0,
    padding: "1.5vmin 2vmin",
    color: tokens.color.text.base,
    fontSize: tokens.font.fluid.md,
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
 * 成果物リンク（ボタン）
 * ======================================= */

export const linkCardButton = style([
  themeTransition,
  {
    appearance: "none",
    display: "flex",
    flexDirection: "row",
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
    gap: "1vmin",
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
  fontSize: "clamp(16px, 2vmin, 20px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.accent.neonCyan,
  whiteSpace: "nowrap",
  flexShrink: 0,
});

export const linkValue = style({
  fontSize: "clamp(13px, 1.5vmin, 16px)",
  color: tokens.color.text.base,
  opacity: 0.8,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  width: "100%",
  minWidth: 0,
});
