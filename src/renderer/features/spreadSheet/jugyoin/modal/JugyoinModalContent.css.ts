// src/renderer/features/xxx/xxx.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

// 共通文字スタイル
const baseText = {
  color: tokens.color.text.base,
  fontSize: tokens.font.fluid.md,
};

// コンテンツ全体
export const contentContainer = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  gap: tokens.space.sm,
  padding: "4px",
  boxSizing: "border-box",
  ...baseText,
});

// プロフィールカード
export const profileCard = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.space.sm,
    padding: tokens.space.sm,
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.raised.md,
    boxSizing: "border-box",
    flexShrink: 0,
    color: tokens.color.text.base,
  },
]);

// プロフィール一覧
export const profileGrid = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: tokens.space.xs,
  flex: 1,
  minWidth: 0,
});

// プロフィール項目
export const profileItem = style([
  themeTransition,
  {
    display: "inline-flex",
    alignItems: "center",
    padding: `${tokens.space.xs} ${tokens.space.sm}`,
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.low,
    fontWeight: tokens.font.weight.bold,
    whiteSpace: "nowrap",
    color: tokens.color.text.base,
    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      },
    },
  },
]);

// テーブル全体
export const tableGrid = style([
  themeTransition,
  {
    display: "grid",
    flex: 1,
    minHeight: 0,
    gridTemplateColumns: "minmax(80px, 1.2fr) minmax(60px, 1fr) 2.5fr 3.5fr",
    padding: tokens.space.sm,
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.raised.md,
    boxSizing: "border-box",
    overflow: "hidden",
    color: tokens.color.text.base,
    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.high}`,
      },
    },
  },
]);

// セル共通スタイル
const baseCell = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2px 4px",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.sm,
    boxSizing: "border-box",
    fontSize: tokens.font.fluid.md,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text.base,
    minWidth: 0,
    overflow: "hidden",
  },
]);

// テキスト共通スタイル
const baseTextStyle = style({
  ...baseText,
  whiteSpace: "nowrap",
});

// ラベル
export const label = style([
  baseTextStyle,
  {
    fontWeight: tokens.font.weight.medium,
    opacity: 0.8,
  },
]);

// 値
export const value = style([
  baseTextStyle,
  {
    fontWeight: tokens.font.weight.bold,
    textOverflow: "ellipsis",
    overflow: "hidden",
  },
]);

// セルバリエーション
export const cell = styleVariants({
  date: [
    baseCell,
    {
      gridRow: "span 3",
      flexDirection: "column",
      gap: "2px",
      borderRadius: tokens.radius.md,
      boxShadow: tokens.shadow.pressed.md,
    },
  ],
  header: [
    baseCell,
    {
      boxShadow: tokens.shadow.raised.low,
    },
  ],
  section: [
    baseCell,
    {
      boxShadow: tokens.shadow.pressed.low,
    },
  ],
  data: [
    baseCell,
    {
      wordBreak: "break-all",
      boxShadow: tokens.shadow.pressed.low,
    },
  ],
});

// テーブル内セルの文字色を親の hover 状態に連動
const tableGridHoverText = style({
  selectors: {
    [`${tableGrid}:hover &`]: {
      color: tokens.color.text.hover,
    },
  },
});

export const tableGridText = tableGridHoverText;
