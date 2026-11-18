// src/renderer/components/ui/button/pollingToggleButton/pollingToggleButton.css.ts

import { keyframes, style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import {
  brandGradientText,
  brandGradientTextRule,
  createBeforeGlowRule,
  focusRing,
} from "@renderer/styles/global/surfaces.css";
import { baseButton } from "../buttonBase.css";

const pulse = keyframes({
  "0%": {
    boxShadow: `0 0 0 0 ${tokens.color.accent.neonCyan}, 0 0 8px ${tokens.color.accent.neonCyan}`,
  },
  "70%": {
    boxShadow: `0 0 0 6px rgba(0, 0, 0, 0), 0 0 8px ${tokens.color.accent.neonCyan}`,
  },
  "100%": {
    boxShadow: `0 0 0 0 rgba(0, 0, 0, 0), 0 0 8px ${tokens.color.accent.neonCyan}`,
  },
});

const syncBlink = keyframes({
  "0%, 100%": {
    opacity: 1,
  },
  "50%": {
    opacity: 0.3,
  },
});

export const button = style([
  baseButton,
  focusRing,
  {
    flexDirection: "row",
    justifyContent: "space-between",
    whiteSpace: "nowrap",
    gap: tokens.space.md,
    width: "18.5rem",
    height: "3.2rem",
    padding: `0 ${tokens.space.lg}`,
    border: `1px solid ${tokens.color.border.default}`,
    borderRadius: tokens.radius.full,
    fontFamily: tokens.font.base,
    fontSize: tokens.font.size.md,
    fontWeight: tokens.font.weight.bold,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    boxShadow: tokens.shadow.raised.md,
    flexShrink: 0,
    transition: `border-color ${tokens.transition.glow}, color ${tokens.transition.fast}`,

    "::before": createBeforeGlowRule(
      `${tokens.shadow.glow.cyan}, ${tokens.shadow.pressed.low}`,
      {
        borderRadius: tokens.radius.full,
        willChange: "opacity",
      },
    ),

    selectors: {
      "&:hover:not(:disabled)": {
        color: tokens.color.text.hover,
      },
      "&:hover:not(:disabled)::before": {
        opacity: 1,
      },
      "&[data-pressed]": {
        borderColor: tokens.color.border.accent,
      },
      "&[data-pressed]::before": {
        opacity: 1,
      },
    },
  },
]);

export const statusGroup = style({
  position: "relative",
  zIndex: 1,
  display: "inline-flex",
  alignItems: "center",
  gap: tokens.space.sm,
  flexShrink: 0,
});

export const indicator = style({
  position: "relative",
  display: "grid",
  placeItems: "center",
  width: "1em",
  height: "1em",
  flexShrink: 0,
});

export const dot = style({
  width: "0.6em",
  height: "0.6em",
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.text.base,
  opacity: 0.5,
  transition: `opacity ${tokens.transition.fast}`,

  selectors: {
    [`${button}[data-pressed] &`]: {
      backgroundColor: "transparent",
      backgroundImage: tokens.gradient.brand,
      opacity: 1,
      animation: `${pulse} 2s infinite ease-in-out`,
    },
  },
});

export const label = style({
  letterSpacing: "0.05em",
  lineHeight: 1.2,
});

export const textSpan = style({
  display: "inline-block",
  color: "inherit",

  selectors: {
    [`${button}[data-pressed] &`]: brandGradientTextRule,
  },
});

/**
 * ボタン右側に内蔵されたデジタル時計表示エリア
 */
export const embeddedClock = style({
  position: "relative",
  zIndex: 1,
  display: "inline-flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "4.6rem",
  paddingLeft: tokens.space.md,
  borderLeft: `1px solid ${tokens.color.border.subtle}`,
  userSelect: "none",
  flexShrink: 0,

  selectors: {
    [`${button}[data-pressed] &`]: {
      borderLeftColor: tokens.color.border.accent,
    },
  },
});

export const clockCaption = style({
  fontFamily: tokens.font.mono,
  fontSize: "9px",
  fontWeight: tokens.font.weight.bold,
  letterSpacing: "0.18em",
  lineHeight: 1,
  marginBottom: "3px",
  color: "inherit",
  opacity: 0.5,
  textTransform: "uppercase",
  whiteSpace: "nowrap",

  selectors: {
    [`${button}[data-pressed] &`]: {
      ...brandGradientTextRule,
      opacity: 1,
    },
  },
});

export const segmentRow = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  height: "20px",
});

export const digitSvg = style({
  width: "12px",
  height: "20px",
  overflow: "visible",
});

export const segmentOff = style({
  fill: "transparent",
});

export const segmentOn = style({
  fill: "currentColor",
  opacity: 0.5,

  selectors: {
    [`${button}[data-pressed] &`]: {
      fill: "url(#polling-brand-gradient)",
      opacity: 1,
      filter: `drop-shadow(0 0 3px ${tokens.color.accent.neonCyan})`,
    },
  },
});

export const unitText = style({
  fontFamily: tokens.font.mono,
  fontSize: "11px",
  fontWeight: tokens.font.weight.bold,
  lineHeight: 1,
  alignSelf: "flex-end",
  marginBottom: "1px",
  color: "inherit",
  opacity: 0.5,

  selectors: {
    [`${button}[data-pressed] &`]: {
      ...brandGradientTextRule,
      opacity: 1,
    },
  },
});

export const syncText = style([
  brandGradientText,
  {
    fontFamily: tokens.font.mono,
    fontSize: "16px",
    fontWeight: tokens.font.weight.bold,
    letterSpacing: "0.14em",
    lineHeight: 1,
    animation: `${syncBlink} 0.85s ease-in-out infinite`,
  },
]);