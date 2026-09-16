// src/renderer/features/other/components/modal/contents/gmailDraft/gmailDraftContent.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

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

export const fieldGroup = style({
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.xs,
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

/* ------------------------------------------------------------
 * ベース Input スタイル (凹: Inset/Pressed 表現)
 * ------------------------------------------------------------ */
export const input = style({
  width: "100%",
  padding: `${tokens.space.sm} ${tokens.space.md}`,
  borderRadius: tokens.radius.md,
  backgroundColor: tokens.color.bg.base, // 🎯 インセット背景色
  border: `1px solid ${tokens.color.border.subtle}`, // 🎯 控えめな境界線
  color: tokens.color.text.base,
  fontSize: tokens.font.size.sm,
  outline: "none",
  boxSizing: "border-box",
  boxShadow: tokens.shadow.pressed.low, // 🎯 凹のシャドウを適用
  transition: tokens.transition.normal,

  selectors: {
    "&:focus": {
      borderColor: tokens.color.accent.base,
      boxShadow: `${tokens.shadow.pressed.low}, ${tokens.shadow.glow.brand}`,
    },
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.7,
    },
  },
});

/* ------------------------------------------------------------
 * テンプレート選択のみ 凸 (Raised) スタイル
 * ------------------------------------------------------------ */
export const selectInput = style([
  input,
  {
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    paddingRight: "32px",
    cursor: "pointer",
    backgroundColor: tokens.color.bg.base, // 🎯 通常背景色
    border: `1px solid ${tokens.color.border.default}`,
    boxShadow: tokens.shadow.raised.low, // 🎯 凸のシャドウを適用

    backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8"><path fill="%2300C8B4" d="M0 0l6 7 6-7z"/></svg>')`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "12px 8px",

    selectors: {
      "&:hover:not(:disabled)": {
        borderColor: tokens.color.accent.base,
        boxShadow: `${tokens.shadow.raised.low}, ${tokens.shadow.glow.brand}`,
      },
      "&:focus": {
        borderColor: tokens.color.accent.base,
        boxShadow: `${tokens.shadow.raised.low}, ${tokens.shadow.glow.brand}`,
      },
    },
  },
]);

/* ------------------------------------------------------------
 * Textarea スタイル (すべて input を継承して凹型)
 * ------------------------------------------------------------ */
const baseTextarea = style([
  input,
  {
    resize: "none",
    fontFamily: tokens.font.base,
    lineHeight: 1.5,
  },
]);

export const addressTextarea = style([
  baseTextarea,
  {
    minHeight: "42px",
    maxHeight: "80px",
  },
]);

export const bodyTextarea = style([
  baseTextarea,
  {
    height: "100%",
    minHeight: "150px",
  },
]);
