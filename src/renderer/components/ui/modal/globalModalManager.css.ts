// src/renderer/components/ui/modal/globalModalManager.css.ts

import { style } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

/* =======================================
 * 背景オーバーレイ
 * ======================================= */
export const overlay = style({
  position: "fixed",
  inset: 0,
  zIndex: tokens.zIndex.overlay,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

/* =======================================
 * モーダルコンテンツ枠組み
 * ======================================= */
export const contentWrapper = style([
  themeTransition,
  {
    position: "relative",
    zIndex: tokens.zIndex.modal,
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.raised.high,
    border: `1px solid ${tokens.color.border.default}`,
    outline: "none",
    overflow: "hidden",
    boxSizing: "border-box",

    // ★ Flexbox直下の%計算バグを防ぐため、ビューポート（画面）基準で85%を明示指定
    width: "85vw",
    height: "85vh",

    // 中身の幅に影響されて変形（潰れ/伸縮）するのを完全に防ぐ
    flexShrink: 0,
    flexGrow: 0,
  },
]);
