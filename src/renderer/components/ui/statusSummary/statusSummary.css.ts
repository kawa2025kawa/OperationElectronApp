// src/renderer/components/ui/statusSummary/statusSummary.css.ts

import {
  createVar,
  keyframes,
  style,
  styleVariants,
  type StyleRule,
} from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { getStatusTheme } from "@renderer/styles/tokens/statusTheme";
import type { JobStatus } from "@shared/types/operation/operationTypes";

const glowShadowVar = createVar();

const neonGlowPulse = keyframes({
  "0%, 100%": {
    opacity: 1,
    transform: "scale(1)",
  },
  "50%": {
    opacity: 0.35,
    transform: "scale(0.985)",
  },
});

const neonBorderPulse = keyframes({
  "0%, 100%": {
    boxShadow:
      "inset 0 0 8px currentColor, 0 0 6px currentColor, 0 0 14px currentColor",
  },
  "50%": {
    boxShadow:
      "inset 0 0 2px currentColor, 0 0 2px currentColor, 0 0 5px currentColor",
  },
});

export const container = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: tokens.space.sm,
  width: "100%",
  flex: 1,
  minWidth: 0,
  position: "relative",
  isolation: "isolate",
});

export const statusItem = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: tokens.space.xs,
  flex: 1,
  minWidth: "max-content",
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  position: "relative",
  isolation: "isolate",
});

export const statusItemProgress = style({
  cursor: "default",
});

export const statusItemActive = style({});

export const valueBadge = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "32px",
  borderRadius: tokens.radius.md,
  fontFamily: tokens.font.mono,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.raised.low,
  border: "2px solid transparent",
  boxSizing: "border-box",
  transition: `border-color ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,

  "::before": {
    content: '""',
    position: "absolute",
    inset: "-2px",
    borderRadius: tokens.radius.md,
    boxShadow: glowShadowVar,
    opacity: 0,
    transition: `opacity ${tokens.transition.ease}`,
    pointerEvents: "none",
    willChange: "opacity, transform",
  },

  selectors: {
    [`${statusItem}:hover &::before`]: {
      opacity: 1,
    },
    [`${statusItemActive} &`]: {
      borderColor: "currentColor",
      animation: `${neonBorderPulse} 1.6s ease-in-out infinite`,
    },
    [`${statusItemActive} &::before`]: {
      opacity: 1,
      border: "2px solid currentColor",
      boxShadow: `${glowShadowVar}, 0 0 12px currentColor, 0 0 22px currentColor`,
      animation: `${neonGlowPulse} 1.6s ease-in-out infinite`,
    },
  },
});

export const label = style({
  fontSize: tokens.font.size.xs,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  whiteSpace: "nowrap",
  transition: `color ${tokens.transition.ease}`,
  selectors: {
    [`${statusItem}:hover &`]: {
      color: tokens.color.text.hover,
    },
    [`${statusItemActive} &`]: {
      color: tokens.color.text.hover,
      textShadow: "0 0 8px currentColor",
    },
  },
});

const createVariantStyle = (
  color: string,
  glow: string | undefined,
): StyleRule => ({
  color,
  vars: {
    [glowShadowVar]: glow
      ? `${tokens.shadow.raised.low}, ${glow}`
      : tokens.shadow.raised.low,
  },
});

const createStatusVariant = (status: JobStatus): StyleRule => {
  const theme = getStatusTheme(status);

  return createVariantStyle(theme.color, theme.glow);
};

const totalVariant = createVariantStyle(
  tokens.color.status.total,
  tokens.shadow.glow.total,
);

export const valueBadgeVariants = styleVariants({
  progress: totalVariant,
  total: totalVariant,

  success: createStatusVariant("success"),
  running: createStatusVariant("running"),
  scriptRunning: createStatusVariant("scriptRunning"),
  waiting: createStatusVariant("waiting"),
  scheduled: createStatusVariant("scheduled"),
  ready: createStatusVariant("ready"),
  needsAction: createStatusVariant("needsAction"),
  error: createStatusVariant("error"),
});
