// src/renderer/features/operation/components/modal/scriptModal/scriptModalContent.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

/* =======================================
 * スクロールバー設定
 * ======================================= */

const scrollable = style({
  overflowY: "auto",
  overflowX: "hidden",
  scrollbarWidth: "thin",
  scrollbarColor: `${tokens.color.accent.base} ${tokens.color.bg.base}`,
  selectors: {
    "&::-webkit-scrollbar": { width: "8px" },
    "&::-webkit-scrollbar-track": {
      background: tokens.color.bg.base,
      borderRadius: tokens.radius.md,
    },
    "&::-webkit-scrollbar-thumb": {
      background: tokens.color.accent.base,
      borderRadius: tokens.radius.md,
      border: `2px solid ${tokens.color.bg.base}`,
    },
    "&::-webkit-scrollbar-thumb:hover": {
      background: tokens.color.accent.neonCyan,
    },
  },
});

/* =======================================
 * レイアウト構造 (グローバルModal内枠)
 * ======================================= */

export const contentFlexContainer = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  gap: "1.5vmin",
  minHeight: 0,
  overflow: "hidden",
  boxSizing: "border-box",
});

/* =======================================
 * 上部：Infobox (完了・エラー・通知を表示する固定枠)
 * ======================================= */

const infoBoxBase = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "0.8vmin 1.5vmin",
    borderRadius: tokens.radius.md,
    fontSize: tokens.font.fluid.md,
    fontWeight: tokens.font.weight.bold,
    textAlign: "center",
    flexShrink: 0,
    boxSizing: "border-box",
  },
]);

export const infoBoxVariants = styleVariants({
  info: [
    infoBoxBase,
    {
      backgroundColor: tokens.color.bg.base,
      color: tokens.color.text.base,
      boxShadow: tokens.shadow.pressed.low,
      border: `1px solid ${tokens.color.border.subtle}`,
    },
  ],
  success: [
    infoBoxBase,
    {
      backgroundColor: "rgba(74, 222, 128, 0.1)",
      color: tokens.color.status?.success ?? "#4ade80",
      border: `1px solid ${tokens.color.status?.success ?? "#4ade80"}`,
      boxShadow: tokens.shadow.pressed.low,
    },
  ],
  warning: [
    infoBoxBase,
    {
      backgroundColor: "rgba(250, 204, 21, 0.1)",
      color: "#facc15",
      border: "1px solid #facc15",
      boxShadow: tokens.shadow.pressed.low,
    },
  ],
  error: [
    infoBoxBase,
    {
      backgroundColor: "rgba(248, 113, 113, 0.1)",
      color: tokens.color.status?.error ?? "#f87171",
      border: `1px solid ${tokens.color.status?.error ?? "#f87171"}`,
      boxShadow: tokens.shadow.pressed.low,
    },
  ],
});

/* =======================================
 * 下部：メインコンテナ (縦スクロールバー限定エリア)
 * ======================================= */

export const mainContainer = style([
  themeTransition,
  scrollable,
  {
    flex: 1,
    width: "100%",
    minHeight: 0,
    padding: "1.5vmin 2vmin",
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.bg.base,
    boxShadow: tokens.shadow.pressed.md,
    border: `1px solid ${tokens.color.border.subtle}`,
    boxSizing: "border-box",
  },
]);

export const rawTextContent = style({
  fontFamily: tokens.font.mono,
  fontSize: tokens.font.fluid.md,
  lineHeight: 1.6,
  color: tokens.color.text.base,
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
  margin: 0,
});

export const artifactList = style({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  marginTop: "16px",
});

/* =======================================
 * 成果物リンクボタン
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
    selectors: {
      "&:hover, &:focus-visible": {
        borderColor: tokens.color.accent.neonCyan,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      },
      "&:active": {
        boxShadow: tokens.shadow.pressed.low,
      },
    },
  },
]);

export const linkLabel = style({
  fontSize: tokens.font.fluid.md,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.accent.neonCyan,
  whiteSpace: "nowrap",
  flexShrink: 0,
});

export const linkValue = style({
  fontSize: tokens.font.fluid.md,
  color: tokens.color.text.base,
  opacity: 0.8,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  width: "100%",
  minWidth: 0,
});
