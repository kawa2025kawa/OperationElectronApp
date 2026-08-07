// src/renderer/features/operation/components/modal/contents/pdfUploadModal/pdfUploadModalContent.css.ts
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

// 下部エリア全体
export const bottomSection = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  flex: 1,
  minHeight: 0,
  gap: "1vmin",
});

// ファイル表示・Empty表示を行うスクロールボックス
export const listBox = style([
  pressedSection,
  {
    flex: 1,
    height: "100%",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    gap: "1vmin",
    overflowY: "auto",
    padding: "2vmin",
    boxSizing: "border-box",
  },
]);

// NO DATA コンテナ
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

// NO DATA テキスト
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

// 🎯 追加: アップロードファイルカード (横並び)
export const itemCardRow = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: "1vmin 1.5vmin",
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.bg.base,
    border: `1px solid ${tokens.color.border.subtle}`,
    boxShadow: tokens.shadow.raised.low,
    boxSizing: "border-box",
    width: "100%",
    gap: tokens.space.xs,
  },
]);

// 🎯 追加: ファイル名・パス切り詰め用テキストスタイル
export const truncateText = style({
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  fontSize: "clamp(11px, 1.8vmin, 14px)",
  color: tokens.color.text.base,
});

// ファイル名（タイトル）表示用
export const fileName = style([
  truncateText,
  {
    fontWeight: tokens.font.weight.bold,
    maxWidth: "50%",
  },
]);

// ファイルパス表示用
export const filePath = style([
  truncateText,
  {
    flex: 1,
    opacity: 0.7,
  },
]);
