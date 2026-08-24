// src/renderer/features/other/components/modal/modal.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

// =====================================================
// Modal Outer Frame & Layout
// =====================================================

export const modalContainer = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  width: "100%",
  padding: tokens.space.xl,
  boxSizing: "border-box",
  gap: tokens.space.md,
  overflow: "hidden", // コンテナ自体の不要なスクロールをカット
});

export const header = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingBottom: tokens.space.sm,
  borderBottom: `1px solid ${tokens.color.border.subtle}`,
  flexShrink: 0, // ヘッダーの高さを固定
});

export const modalTitle = style({
  margin: 0,
  fontSize: tokens.font.size.lg,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.hover,
});

export const contentFlexContainer = style({
  display: "flex",
  flex: 1,
  flexDirection: "column",
  minHeight: 0, // Flex子要素の縮小を許可
  gap: tokens.space.md,
  overflowY: "auto", // 🎯 中身だけ縦スクロールを有効化
});

export const sectionTitle = style({
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.hover,
});

// =====================================================
// Footer & Action Buttons
// =====================================================

export const footer = style({
  display: "flex",
  justifyContent: "flex-end",
  gap: tokens.space.sm,
  paddingTop: tokens.space.md,
  borderTop: `1px solid ${tokens.color.border.subtle}`,
  flexShrink: 0, // フッターの高さを固定
});

export const button = style({
  padding: `${tokens.space.sm} ${tokens.space.lg}`,
  borderRadius: tokens.radius.sm,
  border: `1px solid ${tokens.color.border.default}`,
  backgroundColor: tokens.color.bg.base,
  color: tokens.color.text.base,
  fontWeight: tokens.font.weight.bold,
  cursor: "pointer",
  transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,

  selectors: {
    "&:hover:not(:disabled)": {
      borderColor: tokens.color.accent.base,
      color: tokens.color.text.hover,
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
});
