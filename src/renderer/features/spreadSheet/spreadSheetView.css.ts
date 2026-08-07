// src/renderer/features/spreadSheet/spreadSheetView.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

export const viewContainer = style({
  width: "100%",
  height: "100%",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  padding: tokens.space.md,
});

export const inner = style({
  width: "100%",
  height: "100%",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
});

export const tableArea = style({
  flex: 1,
  minHeight: 0,
  width: "100%",
});

export const tablePadding = style({
  padding: `${tokens.space.xs} ${tokens.space.sm}`,
  boxSizing: "border-box",
  height: "100%",
});

export const errorMessage = style({
  padding: tokens.space.xl,
  color: tokens.color.status.error,
  fontSize: tokens.font.size.md,
  fontWeight: tokens.font.weight.bold,
  textAlign: "center",
});
