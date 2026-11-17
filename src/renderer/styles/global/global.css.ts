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

// ============================================================
// Global Theme Transitions
// ============================================================

globalStyle(
  ":where(html[data-theme]) *, :where(html[data-theme]) *::before, :where(html[data-theme]) *::after",
  {
    transitionProperty:
      "background-color, color, border-color, box-shadow, text-shadow, opacity",
    transitionDuration: tokens.transition.normal,
    transitionTimingFunction: "cubic-bezier(0.25, 0.8, 0.25, 1)",
  },
);

globalStyle("body, #root", {
  backgroundColor: tokens.color.bg.base,
  color: tokens.color.text.base,
  transition: `background-color ${tokens.transition.normal}, color ${tokens.transition.normal}`,
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
