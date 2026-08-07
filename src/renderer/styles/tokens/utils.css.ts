// src/renderer/styles/utils.css.ts
import { style, keyframes } from "@vanilla-extract/css";
import { tokens } from "./semantic.contract";

const fadeInUpKeyframes = keyframes({
  "0%": {
    opacity: 0,
    transform: "translateY(10px)",
    filter: "blur(4px)",
  },
  "100%": {
    opacity: 1,
    transform: "translateY(0)",
    filter: "blur(0)",
  },
});

export const animateFadeIn = style({
  animation: `${fadeInUpKeyframes} 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
});

export const truncateText = style({
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
});

export const titleText = style({
  fontWeight: tokens.font.weight.bold,
  letterSpacing: "1px",
});

export const brandGradientText = style({
  backgroundImage: tokens.gradient.brand,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  color: "transparent",
});

export const hideScrollbar = style({
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  selectors: {
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
});

export const glassBackdrop = style({
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
});
