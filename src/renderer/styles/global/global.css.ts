// src/renderer/styles/global/global.css.ts

import { globalStyle } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

// ============================================================
// Reset & Box Sizing
// ============================================================

globalStyle("*, *::before, *::after", {
  boxSizing: "border-box",
  margin: 0,
  padding: 0,
});

globalStyle("*", {
  scrollbarWidth: "thin",
  scrollbarColor: `${tokens.color.accent.neonPink} transparent`,
});

globalStyle("html, body, #root", {
  width: "100%",
  height: "100%",
  overflow: "hidden",
  fontFamily: tokens.font.base,
  fontSize: "16px",
  lineHeight: 1.5,
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
});

globalStyle("body, #root", {
  backgroundColor: tokens.color.bg.base,
  color: tokens.color.text.base,
});

// ============================================================
// Custom Scrollbar (Default: Neon Pink 4px)
// ============================================================

globalStyle("::-webkit-scrollbar", {
  width: "4px",
  height: "4px",
});

globalStyle("::-webkit-scrollbar-track", {
  backgroundColor: "transparent",
});

globalStyle("::-webkit-scrollbar-thumb", {
  backgroundColor: tokens.color.accent.neonPink,
  borderRadius: tokens.radius.full,
});