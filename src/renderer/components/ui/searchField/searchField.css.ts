// src/renderer/components/ui/searchField/searchField.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";
import { searchFieldTokens } from "@renderer/styles/tokens/component/searchField.tokens";

export const inner = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  width: "100%",
  maxWidth: searchFieldTokens.maxWidth,

  // 🎯 描画隔離（フォーカス・アクティブ時のGlowによる全域ペイント波及を遮断）
  isolation: "isolate",
  transform: "translateZ(0)",

  "@media": {
    "screen and (max-width: 900px)": {
      maxWidth: "240px",
    },
    "screen and (max-width: 600px)": {
      maxWidth: "160px",
    },
  },
});

export const searchField = style({
  width: "100%",
  border: "none",
  outline: "none",
  padding: `${tokens.space.sm} ${tokens.space.lg}`,
  borderRadius: searchFieldTokens.radius,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.raised.low,
  color: tokens.color.text.base,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,

  "@media": {
    "screen and (max-width: 600px)": {
      fontSize: tokens.font.size.xs,
    },
  },

  selectors: {
    "&:hover": {
      boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      color: tokens.color.text.hover,
    },
    "&:focus": {
      boxShadow: `${tokens.shadow.glow.brand}, ${tokens.shadow.raised.md}`,
    },
    "&:active": {
      boxShadow: tokens.shadow.pressed.low,
      transform: "scale(0.98) translateY(0)",
    },
    "&::-webkit-search-cancel-button": {
      cursor: "pointer",
    },
  },
});
