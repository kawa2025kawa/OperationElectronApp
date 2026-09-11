// src/renderer/features/spreadSheet/components/modal/shop/shopModalContent.css.ts

import { style } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

// ----------------------------------------------------
// 定数・共通スタイル (Mixin / Base Styles)
// ----------------------------------------------------

const BADGE_WIDTH = "60px";

const rowBase = style({
  display: "flex",
  alignItems: "center",
  gap: tokens.space.md,
  padding: "12px 16px",
});

const gridBase = style({
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  flex: 1,
  gap: tokens.space.md,
  alignItems: "center",
});

const ellipsisStyle = {
  whiteSpace: "nowrap" as const,
  overflow: "hidden" as const,
  textOverflow: "ellipsis" as const,
};

// ----------------------------------------------------
// 全体レイアウト & タブ
// ----------------------------------------------------

export const mainContainer = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
  gap: tokens.space.md,
});

export const contentContainer = style({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  gap: tokens.space.md,
  padding: "4px",
});

export const tabContainer = style({
  display: "flex",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.lg,
  boxShadow: tokens.shadow.pressed.md,
  padding: "6px",
  gap: "4px",
});

export const button = style([
  themeTransition,
  {
    border: "none",
    cursor: "pointer",
    backgroundColor: "transparent",
    color: tokens.color.text.base,
    fontSize: tokens.font.fluid.md,
    fontWeight: tokens.font.weight.bold,
    outline: "none",
    borderRadius: tokens.radius.md,
    padding: "8px 16px",
    selectors: {
      "&:hover": { color: tokens.color.text.hover },
      '&[data-variant="tab"]': {
        flex: 1,
        padding: "8px 12px",
        borderRadius: tokens.radius.sm,
        whiteSpace: "nowrap",
      },
      '&[data-variant="tab"][data-active="true"]': {
        backgroundColor: tokens.color.bg.base,
        color: tokens.color.accent.base,
        boxShadow: tokens.shadow.raised.md,
      },
    },
  },
]);

// ----------------------------------------------------
// タイムレコーダ サマリーバー
// ----------------------------------------------------

export const trTabWrapper = style({
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.md,
});

export const trSummaryRow = style({
  display: "flex",
  alignItems: "center",
  gap: tokens.space.md,
  padding: "8px 14px",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.md,
  boxShadow: tokens.shadow.pressed.low,
  fontSize: tokens.font.fluid.md,
});

export const summaryBadge = style({
  display: "flex",
  alignItems: "center",
  gap: tokens.space.xs,
  whiteSpace: "nowrap",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.accent.base,
});

export const summaryComment = style({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  flex: 1,
  minWidth: 0,
  color: tokens.color.text.base,
  ...ellipsisStyle,
});

export const imageButtonList = style({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  marginLeft: "auto",
});

export const imageLinkButton = style([
  themeTransition,
  {
    border: "none",
    cursor: "pointer",
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    fontWeight: tokens.font.weight.medium,
    borderRadius: tokens.radius.sm,
    padding: "5px 10px",
    boxShadow: tokens.shadow.raised.low,
    outline: "none",
    whiteSpace: "nowrap",
    selectors: {
      "&:hover:not(:disabled)": {
        color: tokens.color.text.hover,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      },
      "&:active:not(:disabled)": {
        boxShadow: tokens.shadow.pressed.low,
      },
      "&:disabled": {
        cursor: "default",
        opacity: 0.35,
        boxShadow: "none",
      },
    },
  },
]);

// ----------------------------------------------------
// テーブルリスト（ヘッダー & データ行）
// ----------------------------------------------------

export const terminalSection = style({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
});

/* --- ヘッダー行 --- */
export const terminalHeaderRow = style([
  rowBase,
  {
    paddingTop: "6px",
    paddingBottom: "6px",
    borderBottom: `1px solid ${tokens.color.border.default}`,
    marginBottom: "2px",
    fontSize: tokens.font.fluid.md,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text.hover,
  },
]);

export const terminalHeaderBadge = style({
  width: BADGE_WIDTH,
  flexShrink: 0,
  textAlign: "center",
});

export const terminalHeaderGrid = style([
  gridBase,
  {
    ...ellipsisStyle,
  },
]);

/* --- データ行 --- */
export const terminalRow = style([
  themeTransition,
  rowBase,
  {
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.low,
    fontSize: tokens.font.fluid.md,
    selectors: {
      "&:hover": {
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
        color: tokens.color.text.hover,
      },
    },
  },
]);

export const terminalBadge = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: BADGE_WIDTH,
  height: "36px",
  flexShrink: 0,
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.sm,
  boxShadow: tokens.shadow.pressed.md,
  color: tokens.color.accent.base,
  fontWeight: tokens.font.weight.bold,
  letterSpacing: "0.5px",
});

// 🎯【修正箇所】配列の中にクラス名と上書きオブジェクトを並べる
export const nonTrBadge = style([
  terminalBadge,
  {
    width: "120px",
    justifyContent: "flex-start",
    paddingLeft: "16px",
  },
]);

export const flexCell = style({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minWidth: 0,
  flex: 1,
});

// 🎯【修正箇所】文字列クラスを直渡しせず配列形式にする
export const terminalGrid = style([gridBase]);

export const cellValue = style({
  ...ellipsisStyle,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  transition: tokens.transition.fast,
  selectors: {
    [`${terminalRow}:hover &`]: {
      color: tokens.color.text.hover,
    },
  },
});

// ----------------------------------------------------
// Action Row (フッター)
// ----------------------------------------------------

export const actionRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: tokens.space.sm,
  marginTop: "auto",
  paddingTop: tokens.space.sm,
  borderTop: `1px solid ${tokens.color.border.subtle}`,
});
