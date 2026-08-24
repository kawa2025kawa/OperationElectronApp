//src\renderer\features\spreadSheet\components\modal\jugyoin\jugyoinModalContent.css.ts

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
  borderBottom: `1px solid ${tokens.color.border.default}`,
  flexShrink: 0,
  gap: tokens.space.md,
});

export const modalTitle = style({
  margin: 0,
  fontSize: tokens.font.size.lg,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.hover,
});

export const contentContainer = style({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  gap: tokens.space.md,
  padding: tokens.space.xs,
});

export const footer = style({
  display: "flex",
  justifyContent: "flex-end",
  gap: tokens.space.sm,
  paddingTop: tokens.space.md,
  borderTop: `1px solid ${tokens.color.border.default}`,
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
    borderRadius: tokens.radius.sm,
    padding: `${tokens.space.sm} ${tokens.space.lg}`,

    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
        boxShadow: `${tokens.shadow.glow.brand}, ${tokens.shadow.raised.md}`,
      },
      "&:active": {
        boxShadow: tokens.shadow.pressed.low,
      },
      '&[data-variant="pill"]': {
        padding: `${tokens.space.xs} ${tokens.space.md}`,
        borderRadius: tokens.radius.md,
        color: tokens.color.accent.base,
        fontSize: tokens.font.size.sm,
        boxShadow: tokens.shadow.raised.md,
      },
    },
  },
]);

export const textGroup = style({
  display: "flex",
  gap: tokens.space.md,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  marginLeft: "auto",
});

export const label = style({
  fontSize: tokens.font.size.lg,
  fontWeight: tokens.font.weight.medium,
  color: tokens.color.text.base,
  opacity: 0.8,
  transition: `color ${tokens.transition.normal}, opacity ${tokens.transition.normal}`,
});

export const value = style({
  fontSize: tokens.font.size.md,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  wordBreak: "break-all",
  transition: `color ${tokens.transition.normal}`,
});

// ============================================================
// トークン完全準拠 ニューモーフィズム テーブルグリッド
// ============================================================

export const tableGrid = style([
  themeTransition,
  {
    display: "grid",
    flex: 1,
    gridTemplateColumns: "1.5fr 1fr 2.5fr 3.5fr",
    gridTemplateRows: "1fr 1.2fr 1.2fr",
    gap: tokens.space.xs,
    padding: tokens.space.sm,
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.raised.md,
    boxSizing: "border-box",

    selectors: {
      "&:hover": {
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.high}`,
      },
    },
  },
]);

export const baseCell = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.space.xs,
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.sm,
    boxSizing: "border-box",
  },
]);

// 左側：日付（凹みプレート）
export const dateCell = style([
  baseCell,
  {
    gridRow: "span 3",
    flexDirection: "column",
    gap: tokens.space.xs,
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.pressed.md,
  },
]);

// ヘッダー（フラット＋微隆起）
export const headerCell = style([
  baseCell,
  {
    fontSize: tokens.font.size.md,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text.hover,
    backgroundColor: tokens.color.bg.base,
    boxShadow: tokens.shadow.raised.low,
  },
]);

// 区分（AM/PM）
export const sectionCell = style([
  baseCell,
  {
    fontSize: tokens.font.size.md,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.accent.base,
    backgroundColor: tokens.color.bg.base,
    boxShadow: tokens.shadow.pressed.low,
  },
]);

// データ表示セル（凹み表示）
export const dataCell = style([
  baseCell,
  {
    fontSize: tokens.font.size.md,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text.base,
    backgroundColor: tokens.color.bg.base,
    wordBreak: "break-all",
    boxShadow: tokens.shadow.pressed.low,
  },
]);
