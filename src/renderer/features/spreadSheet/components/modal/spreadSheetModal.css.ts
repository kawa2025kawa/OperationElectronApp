// src/renderer/features/spreadSheet/components/modal/spreadSheetModal.css.ts
import { style } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

/* =======================================
 * 1. 共通フレーム & レイアウト
 * ======================================= */
export const modalWrapper = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  width: "100%",
  padding: "3vmin",
  boxSizing: "border-box",
  gap: "2vmin",
  fontFamily: tokens.font.base,
});

/* ニューモフィズム凹み（インセット）枠組み */
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

export const modalHeader = style([
  pressedSection,
  {
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1vmin 2vmin",
    flexShrink: 0,
    boxSizing: "border-box",
  },
]);

export const modalContentContainer = style([
  pressedSection,
  {
    flex: 1,
    padding: "3vmin",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "2vmin",
    minHeight: 0,
    boxSizing: "border-box",
  },
]);

/* =======================================
 * 2. 汎用ボタン (Close, ScheduleLink, Tab)
 * ======================================= */
export const button = style([
  themeTransition,
  {
    border: "none",
    cursor: "pointer",
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    fontWeight: tokens.font.weight.bold,
    outline: "none",

    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
        boxShadow: tokens.shadow.glow.cyan,
      },
      "&:active": {
        boxShadow: tokens.shadow.pressed.low,
      },
      // アイコン型 (CloseButton)
      '&[data-variant="icon"]': {
        width: "32px",
        height: "32px",
        borderRadius: tokens.radius.full,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.2rem",
        boxShadow: tokens.shadow.raised.md,
        flexShrink: 0,
      },
      // ピル型 (ScheduleLinkButton)
      '&[data-variant="pill"]': {
        padding: "1vmin 2vmin",
        borderRadius: tokens.radius.md,
        color: tokens.color.accent.base,
        fontSize: "clamp(11px, 1.8vmin, 16px)",
        boxShadow: tokens.shadow.raised.md,
      },
      // タブ型 (TabButton)
      '&[data-variant="tab"]': {
        flex: 1,
        padding: "1vmin 2vmin",
        borderRadius: tokens.radius.sm,
        backgroundColor: "transparent",
        fontSize: "clamp(12px, 2vmin, 16px)",
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

/* =======================================
 * 3. グリッド & カード系
 * ======================================= */
export const gridContainer = style({
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gridAutoRows: "1fr",
  gap: "2vmin",
  width: "100%",
  height: "100%",
  flex: 1,
});

export const card = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "1.5vmin",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.md,
    height: "100%",
    boxSizing: "border-box",

    selectors: {
      "&:hover": {
        boxShadow: tokens.shadow.glow.cyan,
      },
      '&[data-full-width="true"]': {
        gridColumn: "1 / -1",
      },
      '&[data-variant="schedule-row"]': {
        display: "grid",
        gridTemplateColumns: "1.2fr 1.5fr 3fr 1.5fr 3fr",
        gap: "2vmin",
        padding: "2.5vmin",
        alignItems: "stretch",
      },
      '&[data-variant="pressed"]': {
        boxShadow: tokens.shadow.pressed.md,
        gap: "4px",
      },
    },
  },
]);

/* =======================================
 * 4. テキスト (親の card ホバー連動で発光)
 * ======================================= */
export const title = style({
  fontSize: "clamp(18px, 3.5vmin, 32px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  margin: 0,
});

export const textGroup = style({
  display: "flex",
  gap: "2vmin",
  fontSize: "clamp(12px, 2.2vmin, 22px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
});

export const label = style({
  fontSize: "clamp(12px, 2vmin, 16px)",
  fontWeight: tokens.font.weight.medium,
  color: tokens.color.text.base,
  opacity: 0.8,
  marginBottom: "0.5vmin",
  transition: `color ${tokens.transition.ease}, text-shadow ${tokens.transition.ease}, opacity ${tokens.transition.ease}`,

  selectors: {
    // 💡 親の card のホバー発光と完全同期（ネオンシアン発光）
    [`${card}:hover &`]: {
      color: tokens.color.text.hover,
      opacity: 1,
    },
  },
});

export const value = style({
  fontSize: "clamp(14px, 2.5vmin, 24px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  wordBreak: "break-all",
  transition: `color ${tokens.transition.ease}, text-shadow ${tokens.transition.ease}`,

  selectors: {
    // 💡 親の card のホバー発光と完全同期（ネオンシアン発光）
    [`${card}:hover &`]: {
      color: tokens.color.text.hover,
    },
  },
});
