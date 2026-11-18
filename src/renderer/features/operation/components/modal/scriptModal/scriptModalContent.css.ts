// src/renderer/features/operation/components/modal/scriptModal/scriptModalContent.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import {
  createBeforeGlowRule,
  textEllipsis,
} from "@renderer/styles/global/surfaces.css";

export const contentFlexContainer = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  gap: "1.5vmin",
  minHeight: 0,
  overflow: "hidden",
  boxSizing: "border-box",
  isolation: "isolate",
});

const infoBoxBase = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  padding: "0.8vmin 1.5vmin",
  borderRadius: tokens.radius.md,
  boxShadow: tokens.shadow.pressed.low,
  fontSize: tokens.font.fluid.md,
  fontWeight: tokens.font.weight.bold,
  textAlign: "center",
  flexShrink: 0,
  boxSizing: "border-box",
});

export const infoBoxVariants = styleVariants({
  info: [
    infoBoxBase,
    {
      backgroundColor: tokens.color.bg.base,
      color: tokens.color.text.base,
      border: `1px solid ${tokens.color.border.subtle}`,
    },
  ],
  success: [
    infoBoxBase,
    {
      backgroundColor: tokens.color.statusTint.success,
      color: tokens.color.status.success,
      border: `1px solid ${tokens.color.status.success}`,
    },
  ],
  warning: [
    infoBoxBase,
    {
      backgroundColor: tokens.color.statusTint.warning,
      color: tokens.color.status.running,
      border: `1px solid ${tokens.color.status.running}`,
    },
  ],
  error: [
    infoBoxBase,
    {
      backgroundColor: tokens.color.statusTint.error,
      color: tokens.color.status.error,
      border: `1px solid ${tokens.color.status.error}`,
    },
  ],
});

export const mainContainer = style({
  flex: 1,
  width: "100%",
  minHeight: 0,
  padding: "1.5vmin 2vmin",
  borderRadius: tokens.radius.md,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.pressed.md,
  border: `1px solid ${tokens.color.border.subtle}`,
  boxSizing: "border-box",
  isolation: "isolate",
  overflowY: "auto",
  overflowX: "hidden",
});

export const rawTextContent = style({
  fontFamily: tokens.font.mono,
  fontSize: tokens.font.fluid.md,
  lineHeight: 1.6,
  color: tokens.color.text.base,
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
  margin: 0,
});

export const artifactList = style({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  marginTop: "16px",
  isolation: "isolate",
});

export const linkCardButton = style({
  position: "relative",
  appearance: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  width: "100%",
  padding: "1vmin 1.5vmin",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.md,
  border: `1px solid ${tokens.color.border.subtle}`,
  boxShadow: tokens.shadow.raised.md,
  cursor: "pointer",
  textAlign: "left",
  gap: "1vmin",
  outline: "none",
  isolation: "isolate",
  transition: `border-color ${tokens.transition.fast}`,

  "::before": createBeforeGlowRule(tokens.shadow.glowRaised.md, {
    borderRadius: tokens.radius.md,
    willChange: "opacity",
  }),

  selectors: {
    "&:hover, &:focus-visible": {
      borderColor: tokens.color.accent.neonCyan,
    },
    "&:hover::before, &:focus-visible::before": {
      opacity: 1,
    },
    "&:active": {
      boxShadow: tokens.shadow.pressed.low,
    },
  },
});

export const linkLabel = style({
  position: "relative",
  zIndex: 1,
  fontSize: tokens.font.fluid.md,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.accent.neonCyan,
  whiteSpace: "nowrap",
  flexShrink: 0,
});

export const linkValue = style([
  textEllipsis,
  {
    position: "relative",
    zIndex: 1,
    fontSize: tokens.font.fluid.md,
    color: tokens.color.text.base,
    opacity: 0.8,
    width: "100%",
    minWidth: 0,
  },
]);