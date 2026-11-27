// src/renderer/components/ui/emptyState/emptyState.css.ts

import { keyframes, style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

export const emptyWrapper = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  padding: tokens.space.xl,
  boxSizing: "border-box",
  animation: `${fadeIn} 0.2s ease-out`,
});

export const emptyText = style({
  fontSize: "80px",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  marginBottom: tokens.space.md,
});

export const messageText = style({
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.status.error,
  marginBottom: tokens.space.lg,
  textAlign: "center",
});

export const retryButton = style({
  padding: `${tokens.space.sm} ${tokens.space.xl}`,
  borderRadius: tokens.radius.md,
  cursor: "pointer",
  backgroundColor: tokens.color.bg.base,
  color: tokens.color.text.base,
  fontWeight: tokens.font.weight.bold,
  fontSize: tokens.font.size.sm,
  border: `1px solid ${tokens.color.border.default}`,
  boxShadow: tokens.shadow.raised.low,
  outline: "none",
  transition: `all ${tokens.transition.fast}`,

  selectors: {
    "&:hover": {
      borderColor: tokens.color.accent.base,
      color: tokens.color.text.hover,
      boxShadow: tokens.shadow.glow.brand,
    },
    "&:active": {
      boxShadow: tokens.shadow.pressed.low,
      borderColor: tokens.color.border.subtle,
      transform: "translateY(1px)",
    },
  },
});