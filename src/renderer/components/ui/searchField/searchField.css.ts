// src/renderer/components/ui/searchField/searchField.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

// 0.8秒のふわっとした光のイージング
const smoothGlow = "0.8s cubic-bezier(0.25, 0.8, 0.25, 1)";
const t = tokens.transition.normal;

export const inner = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  width: "100%",
  maxWidth: "300px",

  // 🎯 描画隔離
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
  border: `1px solid ${tokens.color.border.default}`,
  outline: "none",
  padding: `${tokens.space.sm} ${tokens.space.lg}`,
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.raised.low,
  color: tokens.color.text.base,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  // 物理移動（scale/transform）を排除し、影・枠線・文字色の遷移に統一
  transition: `box-shadow ${smoothGlow}, border-color ${smoothGlow}, color ${t}, background-color ${t}`,

  "@media": {
    "screen and (max-width: 600px)": {
      fontSize: tokens.font.size.xs,
    },
  },

  selectors: {
    "&:hover": {
      borderColor: tokens.color.accent.neonCyan,
      boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      color: tokens.color.text.hover,
    },
    "&:focus": {
      borderColor: tokens.color.border.accent,
      boxShadow: `${tokens.shadow.glow.brand}, ${tokens.shadow.raised.md}`,
      color: tokens.color.text.hover,
    },
    // 🎯 押し込み（scale / translateY）を撤廃
    "&:active": {
      outline: "none",
    },
    "&::-webkit-search-cancel-button": {
      cursor: "pointer",
    },
  },
});

