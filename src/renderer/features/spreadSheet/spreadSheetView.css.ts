// src/renderer/features/spreadSheet/spreadSheetView.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

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

export const errorContainer = style({
  width: "100%",
  height: "100%",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: tokens.space.md,
  padding: tokens.space.md,
  boxSizing: "border-box",
  color: "currentColor",
  textAlign: "center",
});

export const errorTitle = style({
  fontSize: "1.125rem",
  fontWeight: 600,
});

export const errorMessage = style({
  maxWidth: "min(720px, 100%)",
  fontSize: "0.875rem",
  overflowWrap: "anywhere",
});
