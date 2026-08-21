// src/renderer/features/other/components/modal/otherModal.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

export const modalContainer = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  width: "100%",
  boxSizing: "border-box",
  gap: tokens.space.md,
});

export const contentFlexContainer = style({
  display: "flex",
  flex: 1,
  flexDirection: "column",
  minHeight: 0,
  gap: tokens.space.md,
});

export const sectionTitle = style({
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
});

export const footer = style({
  display: "flex",
  justifyContent: "flex-end",
  gap: tokens.space.sm,
  paddingTop: tokens.space.md,
  borderTop: `1px solid ${tokens.color.border.subtle}`,
});
