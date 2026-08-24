// src/renderer/features/other/components/modal/gmailModal/gmailModalContent.css.ts

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
  overflow: "hidden",
});

export const header = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingBottom: tokens.space.sm,
  borderBottom: `1px solid ${tokens.color.border.subtle}`,
  flexShrink: 0,
});

export const modalTitle = style({
  margin: 0,
  fontSize: tokens.font.size.lg,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.hover,
});

export const formContainer = style({
  display: "flex",
  flex: 1,
  flexDirection: "column",
  gap: tokens.space.md,
  width: "100%",
  minHeight: 0,
  boxSizing: "border-box",
  overflowY: "auto",
  paddingRight: tokens.space.xs,
});

export const footer = style({
  display: "flex",
  justifyContent: "flex-end",
  gap: tokens.space.sm,
  paddingTop: tokens.space.md,
  borderTop: `1px solid ${tokens.color.border.subtle}`,
  flexShrink: 0,
});

// 🎯 凸（Raised）スタイル適用
export const button = style({
  padding: `${tokens.space.sm} ${tokens.space.lg}`,
  borderRadius: tokens.radius.sm,
  border: "none",
  backgroundColor: tokens.color.bg.base,
  color: tokens.color.text.base,
  fontWeight: tokens.font.weight.bold,
  boxShadow: tokens.shadow.raised.low, // 凸シャドウ
  cursor: "pointer",
  transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,

  selectors: {
    "&:hover:not(:disabled)": {
      boxShadow: `${tokens.shadow.glow.brand}, ${tokens.shadow.raised.md}`,
      color: tokens.color.text.hover,
      transform: "translateY(-1px)",
    },
    "&:active:not(:disabled)": {
      boxShadow: tokens.shadow.pressed.low, // 押し込み（凹）
      transform: "translateY(0)",
    },
    "&:disabled": {
      opacity: 0.5,
      boxShadow: "none",
      cursor: "not-allowed",
      transform: "none",
    },
  },
});

// =====================================================
// Fields & Form Elements
// =====================================================

export const fieldGroup = style({
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  flexShrink: 0,
});

export const bodyFieldGroup = style([
  fieldGroup,
  {
    flex: 1,
    minHeight: "180px",
  },
]);

export const label = style({
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
});

export const input = style({
  width: "100%",
  padding: `${tokens.space.sm} ${tokens.space.md}`,
  borderRadius: tokens.radius.md,
  backgroundColor: tokens.color.bg.base,
  border: `1px solid ${tokens.color.border.default}`,
  color: tokens.color.text.base,
  fontSize: tokens.font.size.sm,
  outline: "none",
  boxSizing: "border-box",

  selectors: {
    "&:focus": {
      borderColor: tokens.color.accent.base,
      boxShadow: tokens.shadow.glow.brand,
    },
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.7,
    },
  },
});

export const selectInput = style([
  input,
  {
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    paddingRight: "32px",
    cursor: "pointer",
    backgroundColor: tokens.color.bg.base,
    boxShadow: tokens.shadow.raised.low,
    transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,

    backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8"><path fill="%23FF3CC8" d="M0 0l6 7 6-7z"/></svg>')`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "12px 8px",

    selectors: {
      "&:hover:not(:disabled)": {
        color: tokens.color.text.hover,
        boxShadow: tokens.shadow.glow.cyan,
      },
    },
  },
]);

export const textarea = style([
  input,
  {
    height: "100%",
    minHeight: "150px",
    resize: "none",
    fontFamily: "inherit",
    lineHeight: 1.6,
  },
]);
