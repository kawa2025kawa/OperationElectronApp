// src/renderer/features/other/components/modal/contents/statusSync/statusSyncModal.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

export const container = style({
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.md,
  padding: `${tokens.space.xs} 0`,
  fontFamily: tokens.font.base,
  color: tokens.color.text.base,
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
  boxSizing: "border-box",
});

const infoBoxBase = style({
  padding: `${tokens.space.md} ${tokens.space.lg}`,
  borderRadius: tokens.radius.md,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.medium,
  lineHeight: 1.5,
  backgroundColor: tokens.glass.surfaceSubtle,
  border: `1px solid ${tokens.glass.border}`,
  boxShadow: tokens.shadow.pressed.low,
  flexShrink: 0,
});

export const infoBoxVariants = styleVariants({
  info: [
    infoBoxBase,
    {
      color: tokens.color.text.hover,
      borderColor: tokens.color.border.default,
    },
  ],
  success: [
    infoBoxBase,
    {
      color: tokens.color.status.success,
      borderColor: tokens.color.status.success,
      boxShadow: `${tokens.shadow.pressed.low}, ${tokens.shadow.glow.success}`,
    },
  ],
  error: [
    infoBoxBase,
    {
      color: tokens.color.status.error,
      borderColor: tokens.color.status.error,
      boxShadow: `${tokens.shadow.pressed.low}, ${tokens.shadow.glow.error}`,
    },
  ],
});

export const modeHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingBottom: tokens.space.sm,
  borderBottom: `1px solid ${tokens.color.border.default}`,
  flexShrink: 0,
});

export const modeToggleWrapper = style({
  minWidth: "180px",
});

export const modeToggleWrapperDisabled = style([
  modeToggleWrapper,
  {
    opacity: 0.6,
    pointerEvents: "none",
  },
]);

export const infoGrid = style({
  display: "grid",
  gridTemplateColumns: "140px 1fr",
  rowGap: tokens.space.md,
  columnGap: tokens.space.lg,
  padding: tokens.space.lg,
  borderRadius: tokens.radius.md,
  backgroundColor: tokens.glass.surfaceSubtle,
  border: `1px solid ${tokens.glass.border}`,
  boxShadow: tokens.shadow.raised.low,
  flexShrink: 0,
});

export const label = style({
  fontSize: tokens.font.size.lg,
  fontWeight: tokens.font.weight.medium,
  color: tokens.color.text.base,
  display: "flex",
  alignItems: "center",
  flexShrink: 0,
});

export const value = style({
  fontSize: tokens.font.size.lg,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.hover,
  fontFamily: tokens.font.mono,
});

export const fieldGroup = style({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  gap: tokens.space.sm,
  minHeight: 0,
  overflow: "hidden",
});

export const textarea = style({
  flex: 1,
  width: "100%",
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  padding: tokens.space.md,
  boxSizing: "border-box",
  borderRadius: tokens.radius.md,
  border: `1px solid ${tokens.glass.border}`,
  backgroundColor: tokens.glass.surfaceSubtle,
  boxShadow: tokens.shadow.pressed.low,
  color: tokens.color.text.hover,
  fontFamily: tokens.font.base,
  fontSize: tokens.font.size.md,
  lineHeight: 1.6,
  resize: "none",
  outline: "none",
  selectors: {
    "&::placeholder": {
      color: tokens.color.text.base,
      opacity: 0.65,
    },
    "&:focus": {
      borderColor: tokens.color.border.accent,
      boxShadow: `${tokens.shadow.pressed.low}, ${tokens.shadow.glow.brand}`,
    },
    "&:disabled": {
      opacity: 0.7,
      cursor: "not-allowed",
    },
  },
});

export const noteBox = style({
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  padding: tokens.space.md,
  boxSizing: "border-box",
  borderRadius: tokens.radius.md,
  border: `1px solid ${tokens.glass.border}`,
  backgroundColor: tokens.glass.surfaceSubtle,
  boxShadow: tokens.shadow.pressed.low,
  color: tokens.color.text.hover,
  fontFamily: tokens.font.base,
  fontSize: tokens.font.size.sm,
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
});
