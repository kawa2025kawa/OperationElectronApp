// src/renderer/styles/global/global.css.ts

import { globalStyle } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

const themeEase = tokens.transition.normal;

// ============================================================
// Reset & Box Sizing
// ============================================================

globalStyle("*, *::before, *::after", {
  boxSizing: "border-box",
  margin: 0,
  padding: 0,
});

globalStyle("html, body, #root", {
  width: "100%",
  height: "100%",
  overflow: "hidden",
  fontFamily: tokens.font.base, // 🎯 sans ではなく base に修正
  fontSize: "16px",
  lineHeight: 1.5,
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
});

// ============================================================
// Global Theme Transitions (詳細度を高めて個別スタイルによる打ち消しを防止)
// ============================================================

// テーマ属性が付与された状態の全子要素に対して一括適用
globalStyle(
  ":where(html[data-theme]) *, :where(html[data-theme]) *::before, :where(html[data-theme]) *::after",
  {
    transitionProperty:
      "background-color, color, border-color, box-shadow, text-shadow, opacity",
    transitionDuration: tokens.transition.normal, // 🎯 0.8s に同期
    transitionTimingFunction: "cubic-bezier(0.25, 0.8, 0.25, 1)",
  },
);

globalStyle("body, #root", {
  backgroundColor: tokens.color.bg.base,
  color: tokens.color.text.base,
  transition: `background-color ${tokens.transition.normal}, color ${tokens.transition.normal}`,
});

// ============================================================
// Custom Scrollbar
// ============================================================

globalStyle("::-webkit-scrollbar", {
  width: "8px",
  height: "8px",
});

globalStyle("::-webkit-scrollbar-track", {
  backgroundColor: "transparent",
});

globalStyle("::-webkit-scrollbar-thumb", {
  backgroundColor: tokens.color.border.subtle,
  borderRadius: tokens.radius.full,
  transition: `background-color ${themeEase}`,
});

globalStyle("::-webkit-scrollbar-thumb:hover", {
  backgroundColor: tokens.color.border.default,
});
