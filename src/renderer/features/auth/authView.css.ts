// src/renderer/features/auth/authView.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

/* ============================================================
 * AuthView Root Container
 * ============================================================ */

export const viewContainer = style({
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  containerType: "size",
  overflow: "hidden",
  boxSizing: "border-box",
  padding: `${tokens.space.xs} ${tokens.space.md}`, // 🎯 上下余白を絞り高さ領域を拡張
});
