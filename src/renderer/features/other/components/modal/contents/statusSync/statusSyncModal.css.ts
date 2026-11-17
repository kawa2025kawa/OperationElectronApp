// src/renderer/features/other/components/modal/contents/statusSync/statusSyncModal.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { focusRing } from "@renderer/styles/global/surfaces.css";

export const container = style({
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.lg,
  padding: `${tokens.space.xs} 0`,
  fontFamily: tokens.font.base,
  color: tokens.color.text.base,
  minHeight: 0,
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
});

export const modeToggle = style({
  display: "inline-flex",
  alignItems: "center",
  gap: tokens.space.xs,
  padding: tokens.space.xs,
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.glass.surfaceSubtle,
  border: `1px solid ${tokens.glass.border}`,
  boxShadow: tokens.shadow.pressed.low,
});

export const modeToggleButton = style([
  focusRing,
  {
    minWidth: "88px",
    padding: `${tokens.space.sm} ${tokens.space.lg}`,
    border: "1px solid transparent",
    borderRadius: tokens.radius.full,
    backgroundColor: "transparent",
    color: tokens.color.text.base,
    fontFamily: tokens.font.mono,
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    letterSpacing: "0.06em",
    cursor: "pointer",
    transition: `color ${tokens.transition.fast}, background-color ${tokens.transition.fast}, border-color ${tokens.transition.fast}`,
    selectors: {
      "&:hover:not(:disabled)": {
        color: tokens.color.text.hover,
        backgroundColor: tokens.glass.surface,
      },
      "&:disabled": {
        cursor: "default",
      },
    },
  },
]);

export const modeToggleButtonActive = style({
  color: tokens.color.accent.base,
  backgroundColor: tokens.color.bg.frostedGlass,
  borderColor: tokens.color.border.accent,
  boxShadow: tokens.shadow.glow.brand,
});

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
});

export const label = style({
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.medium,
  color: tokens.color.text.base,
  display: "flex",
  alignItems: "center",
});

export const value = style({
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.hover,
  fontFamily: tokens.font.mono,
});

export const subDateValue = style({
  fontSize: tokens.font.size.xs,
  fontWeight: tokens.font.weight.normal,
  color: tokens.color.text.base,
  fontFamily: tokens.font.mono,
});

export const flagBadgeGroup = style({
  display: "flex",
  alignItems: "center",
  gap: tokens.space.sm,
  flexWrap: "wrap",
});

export const flagBadgeActive = style({
  padding: `2px ${tokens.space.sm}`,
  borderRadius: tokens.radius.sm,
  fontFamily: tokens.font.mono,
  fontSize: tokens.font.size.xs,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.accent.base,
  backgroundColor: tokens.color.bg.frostedGlass,
  border: `1px solid ${tokens.color.border.accent}`,
  boxShadow: tokens.shadow.glow.brand,
});

export const flagBadgeInactive = style({
  padding: `2px ${tokens.space.sm}`,
  borderRadius: tokens.radius.sm,
  fontFamily: tokens.font.mono,
  fontSize: tokens.font.size.xs,
  fontWeight: tokens.font.weight.normal,
  color: tokens.color.text.base,
  backgroundColor: tokens.glass.surfaceSubtle,
  border: `1px solid ${tokens.color.border.default}`,
  boxShadow: tokens.shadow.pressed.low,
  opacity: 0.6,
});

export const fieldGroup = style({
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.sm,
  minHeight: 0,
});

export const textarea = style({
  width: "100%",
  minHeight: "120px",
  maxHeight: "180px",
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
  resize: "vertical",
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
  minHeight: "96px",
  maxHeight: "180px",
  overflowY: "auto",
  overflowX: "hidden",
  padding: tokens.space.md,
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