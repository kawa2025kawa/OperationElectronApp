// src/renderer/features/operation/components/modal/gmailModal/gmailModalContent.css.ts

import { style } from "@vanilla-extract/css";

import { tokens } from "@renderer/styles/tokens";

// =====================================================
// Form
// =====================================================

export const formContainer = style({
  display: "flex",
  flexDirection: "column",
  gap: "1.5vmin",
  width: "100%",
  height: "100%",
  minHeight: 0,
  boxSizing: "border-box",
});

// =====================================================
// Field
// =====================================================

export const fieldGroup = style({
  display: "flex",
  flexDirection: "column",
  gap: "0.5vmin",
  minHeight: 0,
});

export const bodyFieldGroup = style([
  fieldGroup,
  {
    flex: 1,
    minHeight: 0,
  },
]);

// =====================================================
// Label
// =====================================================

export const label = style({
  fontSize: "clamp(12px, 1.8vmin, 14px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
});

// =====================================================
// Input
// =====================================================

export const input = style({
  width: "100%",
  padding: "1vmin 1.5vmin",
  borderRadius: tokens.radius.md,
  backgroundColor: tokens.color.bg.base,
  border: `1px solid ${tokens.color.border.default}`,
  color: tokens.color.text.base,
  fontSize: "clamp(12px, 2vmin, 15px)",
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

// =====================================================
// Textarea
// =====================================================

export const textarea = style([
  input,
  {
    flex: 1,
    minHeight: "180px",
    resize: "none",
    fontFamily: "inherit",
    lineHeight: 1.6,

    // textarea自身ではスクロールさせない
    overflow: "hidden",
  },
]);
