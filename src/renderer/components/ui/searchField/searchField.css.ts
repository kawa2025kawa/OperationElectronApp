// src/renderer/components/ui/searchField/searchField.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

const smoothGlow = "0.8s cubic-bezier(0.25, 0.8, 0.25, 1)";
const t = tokens.transition.normal;

export const inner = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  width: "100%",
  maxWidth: "300px",
  isolation: "isolate",
  transform: "translateZ(0)",

  "::before": {
    content: '""',
    position: "absolute",
    inset: -1,
    borderRadius: tokens.radius.full,
    boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
    opacity: 0,
    transition: `opacity ${smoothGlow}`,
    pointerEvents: "none",
    willChange: "opacity",
  },

  selectors: {
    "&:hover::before": {
      opacity: 1,
    },
    "&:focus-within::before": {
      boxShadow: `${tokens.shadow.glow.brand}, ${tokens.shadow.raised.md}`,
      opacity: 1,
    },
  },

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
  position: "relative",
  zIndex: 1,
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
  transition: `border-color ${smoothGlow}, color ${t}, background-color ${t}`,

  "@media": {
    "screen and (max-width: 600px)": {
      fontSize: tokens.font.size.xs,
    },
  },

  selectors: {
    [`${inner}:hover &`]: {
      borderColor: tokens.color.accent.neonCyan,
      color: tokens.color.text.hover,
    },
    [`${inner}:focus-within &`]: {
      borderColor: tokens.color.border.accent,
      color: tokens.color.text.hover,
    },
    "&:active": {
      outline: "none",
    },
    "&:::-webkit-search-cancel-button": {
      cursor: "pointer",
    },
  },
});
