import { style, styleVariants } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

/* ============================================================
 * 1. Layout Base (モーダル枠・コンテナ)
 * ============================================================ */

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
  padding: "12px",
  boxSizing: "border-box",
});

export const footer = style({
  display: "flex",
  justifyContent: "flex-end",
  gap: tokens.space.sm,
  paddingTop: tokens.space.md,
  borderTop: `1px solid ${tokens.color.border.default}`,
  flexShrink: 0,
});

/* ============================================================
 * 2. Controls & Typography (ボタン・テキストグループ)
 * ============================================================ */

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
    padding: "8px 16px",

    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      },
      "&:active": {
        boxShadow: tokens.shadow.pressed.low,
      },
      // スケジュール用ピルボタン
      '&[data-variant="pill"]': {
        padding: `${tokens.space.xs} ${tokens.space.md}`,
        color: tokens.color.accent.base,
        fontSize: tokens.font.size.sm,
        boxShadow: tokens.shadow.raised.md,
      },
      // タブ用切替ボタン
      '&[data-variant="tab"]': {
        flex: 1,
        padding: "10px 16px",
        borderRadius: tokens.radius.sm,
        backgroundColor: "transparent",
        fontSize: "clamp(12px, 1.8vmin, 15px)",
        whiteSpace: "nowrap",
        boxShadow: "none",
      },
      '&[data-variant="tab"][data-active="true"]': {
        backgroundColor: tokens.color.bg.base,
        color: tokens.color.accent.base,
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

/* ============================================================
 * 3. Schedule Table & Cells (グリッド・同類セルの統合)
 * ============================================================ */

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

/** 🎯 セルのベーススタイル (共通) */
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
    fontSize: tokens.font.size.md,
    fontWeight: tokens.font.weight.bold,
  },
]);

/** 🎯 同類のセルスタイルを1つの `cell` オブジェクト（styleVariants）に一本化 */
export const cell = styleVariants({
  // 日付セル
  date: [
    baseCell,
    {
      gridRow: "span 3",
      flexDirection: "column",
      gap: tokens.space.xs,
      borderRadius: tokens.radius.md,
      boxShadow: tokens.shadow.pressed.md,
    },
  ],
  // ヘッダーセル
  header: [
    baseCell,
    {
      color: tokens.color.text.hover,
      boxShadow: tokens.shadow.raised.low,
    },
  ],
  // 区分 (AM/PM) セル
  section: [
    baseCell,
    {
      color: tokens.color.accent.base,
      boxShadow: tokens.shadow.pressed.low,
    },
  ],
  // データ表示セル
  data: [
    baseCell,
    {
      color: tokens.color.text.base,
      wordBreak: "break-all",
      boxShadow: tokens.shadow.pressed.low,
    },
  ],
});

/* ============================================================
 * 4. Tab & Card Grid (店舗・担当カード表示系)
 * ============================================================ */

export const tabContainer = style({
  display: "flex",
  width: "100%",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.lg,
  boxShadow: tokens.shadow.pressed.md,
  padding: "8px",
  flexShrink: 0,
  boxSizing: "border-box",
  gap: "4px",
});

export const gridContainer = style({
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gridAutoRows: "1fr",
  gap: "16px",
  width: "100%",
  height: "100%",
  minHeight: 0,
  boxSizing: "border-box",
});

export const card = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "16px 20px",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.md,
    boxSizing: "border-box",
    height: "100%",
    minHeight: 0,

    selectors: {
      "&:hover": {
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.high}`,
        transform: "translateY(-1px)",
      },
      '&[data-full-width="true"]': {
        gridColumn: "1 / -1",
      },
    },
  },
]);

export const label = style({
  fontSize: "clamp(12px, 1.8vmin, 15px)",
  fontWeight: tokens.font.weight.medium,
  color: tokens.color.text.base,
  opacity: 0.7,
  marginBottom: "8px",
  transition: `color ${tokens.transition.ease}, opacity ${tokens.transition.ease}`,

  selectors: {
    [`${card}:hover &`]: {
      color: tokens.color.text.hover,
      opacity: 1,
    },
  },
});

export const value = style({
  fontSize: "clamp(14px, 2.2vmin, 20px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  wordBreak: "break-all",
  textAlign: "center",
  transition: `color ${tokens.transition.ease}`,

  selectors: {
    [`${card}:hover &`]: {
      color: tokens.color.text.hover,
    },
  },
});
