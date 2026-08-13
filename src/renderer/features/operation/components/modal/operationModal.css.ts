// src/renderer/features/operation/components/modal/operationModal.css.ts

import { style } from "@vanilla-extract/css";

import { themeTransition, tokens } from "@renderer/styles/tokens";

/* =======================================
 * 1. 共通基調スタイル
 * ======================================= */

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

/* =======================================
 * 2. モーダル全体レイアウト
 * ======================================= */

export const container = style({
  display: "grid",
  gridTemplateRows: "auto 1fr",
  width: "100%",
  height: "100%",
  padding: "3vmin",
  gap: "2vmin",
  boxSizing: "border-box",
});

export const header = style([
  pressedSection,
  {
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1vmin 2vmin",
    boxSizing: "border-box",
  },
]);

export const modalTitle = style({
  margin: 0,
  fontSize: "clamp(16px, 3vmin, 24px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
});

export const centerContent = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: 0,
  flex: 1,
  padding: "1vmin 0",
  boxSizing: "border-box",
  overflow: "hidden",
});

/* =======================================
 * 3. 共通コンテンツラッパー
 * ======================================= */

export const contentFlexContainer = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  gap: "2vmin",
  minHeight: 0,
  boxSizing: "border-box",
});

export const mainMessage = style({
  fontSize: "clamp(14px, 2.5vmin, 22px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  textAlign: "center",
  margin: 0,
  padding: "0.5vmin 0",
});

export const sectionTitle = style({
  fontSize: "clamp(11px, 1.8vmin, 15px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  textAlign: "left",
  userSelect: "none",
});

/* =======================================
 * 4. アクションボタン
 * ======================================= */

export const actionContainer = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "2vmin",
  width: "100%",
  marginTop: "auto",
  paddingTop: "1vmin",
});

// src/renderer/features/operation/components/modal/operationModal.css.ts
export const button = style([
  themeTransition,
  {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1vmin 2.5vmin",
    borderRadius: tokens.radius.md,
    fontSize: "clamp(12px, 2vmin, 16px)",
    fontWeight: tokens.font.weight.bold,
    cursor: "pointer",
    outline: "none",
    minWidth: "120px",
    boxSizing: "border-box",
    transition: tokens.transition.fast,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    border: `1px solid ${tokens.color.border.default}`,
    boxShadow: tokens.shadow.raised.low,
    selectors: {
      "&:hover:not(:disabled)": {
        borderColor: tokens.color.accent.neonCyan,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
        color: tokens.color.text.onAccent,
      },
      "&:active:not(:disabled)": {
        boxShadow: tokens.shadow.pressed.low,
      },
      "&:disabled": {
        opacity: 0.4,
        cursor: "not-allowed",
        boxShadow: "none",
        backgroundColor: tokens.color.bg.inset,
        borderColor: tokens.color.border.subtle,
        color: tokens.color.text.base,
        textShadow: "none",
      },
    },
  },
]);
