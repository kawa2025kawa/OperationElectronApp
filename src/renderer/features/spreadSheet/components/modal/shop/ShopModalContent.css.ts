// src/renderer/features/spreadSheet/components/modal/shop/shopModalContent.css.ts

import { style } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

// ----------------------------------------------------
// 定数（ヘッダーとデータ行で幅・余白を完全同期するための共通定義）
// ----------------------------------------------------

/** 端末番号バッジの固定幅 */
const BADGE_WIDTH = "60px";

/** 行全体の左右パディング・ギャップ共通スタイル */
const rowBaseStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 16px",
  boxSizing: "border-box" as const,
};

/** 5列均等グリッドの共通スタイル */
const gridBaseStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  flex: 1,
  gap: "12px",
  alignItems: "center",
};

// ----------------------------------------------------
// 全体レイアウト & タブ
// ----------------------------------------------------

export const mainContainer = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
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
  boxSizing: "border-box",
});

export const tabContainer = style({
  display: "flex",
  width: "100%",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.lg,
  boxShadow: tokens.shadow.pressed.md,
  padding: "6px",
  flexShrink: 0,
  boxSizing: "border-box",
  gap: "4px",
});

export const button = style([
  themeTransition,
  {
    border: "none",
    cursor: "pointer",
    backgroundColor: "transparent",
    color: tokens.color.text.base,
    fontWeight: tokens.font.weight.bold,
    outline: "none",
    borderRadius: tokens.radius.md,
    padding: "8px 16px",
    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
      },
      '&[data-variant="tab"]': {
        flex: 1,
        padding: "8px 12px",
        borderRadius: tokens.radius.sm,
        fontSize: "clamp(12px, 1.6vmin, 14px)",
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
// タイムレコーダ上部サマリーバー
// ----------------------------------------------------

export const trTabWrapper = style({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  width: "100%",
});

export const trSummaryRow = style({
  display: "flex",
  alignItems: "center",
  gap: "16px",
  padding: "8px 14px",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.md,
  boxShadow: tokens.shadow.pressed.low,
  boxSizing: "border-box",
});

export const summaryBadge = style({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  whiteSpace: "nowrap",
});

export const summaryLabel = style({
  fontSize: "12px",
  fontWeight: tokens.font.weight.medium,
  color: tokens.color.text.base,
  opacity: 0.6,
});

export const summaryValue = style({
  fontSize: "15px",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.accent.base,
});

export const summaryComment = style({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
});

export const summaryCommentText = style({
  fontSize: "12px",
  color: tokens.color.text.base,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const imageButtonList = style({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  marginLeft: "auto",
  flexShrink: 0,
});

export const imageLinkButton = style([
  themeTransition,
  {
    border: "none",
    cursor: "pointer",
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    fontSize: "11px",
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
// タイムレコーダー テーブルリスト（完全同期レイアウト）
// ----------------------------------------------------

export const terminalSection = style({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  width: "100%",
});

/* --- ヘッダー行 --- */
export const terminalHeaderRow = style([
  rowBaseStyle,
  {
    paddingTop: "6px",
    paddingBottom: "6px",
    borderBottom: `1px solid ${tokens.color.border.default}`,
    marginBottom: "2px",
  },
]);

export const terminalHeaderBadge = style({
  width: BADGE_WIDTH,
  flexShrink: 0,
  fontSize: tokens.font.fluid.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.hover,
  textAlign: "center",
});

export const terminalHeaderGrid = style(gridBaseStyle);

export const terminalHeaderCell = style({
  fontSize: tokens.font.fluid.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.hover,
  textAlign: "left",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

/* --- データ行 --- */
export const terminalRow = style([
  themeTransition,
  rowBaseStyle,
  {
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.low,
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
  fontSize: "13px",
  letterSpacing: "0.5px",
});

export const terminalGrid = style(gridBaseStyle);

export const terminalCell = style({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minWidth: 0,
});

export const cellLabel = style({
  fontSize: "11px",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.accent.base,
  marginBottom: "4px",
});

export const cellValue = style({
  fontSize: "14px",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  transition: tokens.transition.fast, // ホバー時のカラー遷移を滑らかにするため追記
  selectors: {
    // 親の terminalRow がホバーされた時に自身の文字色を変更
    [`${terminalRow}:hover &`]: {
      color: tokens.color.text.hover,
    },
  },
});
