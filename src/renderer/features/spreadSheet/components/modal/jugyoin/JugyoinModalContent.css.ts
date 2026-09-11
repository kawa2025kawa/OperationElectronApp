// src/renderer/features/spreadSheet/components/modal/jugyoin/JugyoinModalContent.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

export const contentContainer = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden", // 🎯 横スクロール発生を防止
  gap: tokens.space.sm,
  padding: "4px",
  boxSizing: "border-box",
});

/**
 * 1段目: 凸型（Neumorphism）プロフィールカード
 */
export const profileCard = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.space.sm,
    padding: tokens.space.sm, // 🎯 縮小時の潰れ防止
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.raised.md,
    boxSizing: "border-box",
    flexShrink: 0, // 🎯 上段が縦に潰れるのを防止
  },
]);

export const profileGrid = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: tokens.space.xs,
  flex: 1,
  minWidth: 0, // 🎯 flex要素の文字溢れ破綻を防止
});

/**
 * 各項目をそれぞれ「凸型」にしたバッジスタイル
 */
export const profileItem = style([
  themeTransition,
  {
    display: "inline-flex",
    alignItems: "center",
    padding: `${tokens.space.xs} ${tokens.space.sm}`,
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.low, // 凸型影
    fontSize: tokens.font.fluid.md,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text.base,
    whiteSpace: "nowrap",
    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      },
    },
  },
]);

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
    borderRadius: tokens.radius.md,
    padding: "6px 12px",
    fontSize: tokens.font.fluid.md,
    whiteSpace: "nowrap",
    flexShrink: 0,
    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      },
      "&:active": {
        boxShadow: tokens.shadow.pressed.low,
      },
      '&[data-variant="pill"]': {
        padding: `${tokens.space.xs} ${tokens.space.sm}`,
        color: tokens.color.accent.base,
        boxShadow: tokens.shadow.raised.md,
      },
    },
  },
]);

export const textGroup = style({
  display: "flex",
  gap: tokens.space.sm,
  fontSize: tokens.font.fluid.md,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  whiteSpace: "nowrap",
  minWidth: 0,
});

export const tableGrid = style([
  themeTransition,
  {
    display: "grid",
    flex: 1,
    minHeight: 0, // 🎯 高さを親の Flex に完全追従させる指定
    gridTemplateColumns: "minmax(80px, 1.2fr) minmax(60px, 1fr) 2.5fr 3.5fr", // 🎯 最小幅を保障
    gridTemplateRows: "repeat(3, minmax(0, 1fr))", // 🎯 均等かつ自動可変
    gap: tokens.space.xs,
    padding: tokens.space.sm,
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.raised.md,
    boxSizing: "border-box",
    overflow: "hidden",
    selectors: {
      "&:hover": {
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.high}`,
      },
    },
  },
]);

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
    minWidth: 0, // 🎯 テキスト溢れによるセル崩れ防止
    minHeight: 0,
    overflow: "hidden",
  },
]);

export const label = style({
  fontSize: tokens.font.fluid.md,
  fontWeight: tokens.font.weight.medium,
  color: tokens.color.text.base,
  opacity: 0.8,
  whiteSpace: "nowrap",
});

export const value = style({
  fontSize: tokens.font.fluid.md,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap",
});

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
      color: tokens.color.text.hover,
      boxShadow: tokens.shadow.raised.low,
    },
  ],
  section: [
    baseCell,
    {
      color: tokens.color.accent.base,
      boxShadow: tokens.shadow.pressed.low,
    },
  ],
  data: [
    baseCell,
    {
      color: tokens.color.text.base,
      wordBreak: "break-all",
      boxShadow: tokens.shadow.pressed.low,
    },
  ],
});
