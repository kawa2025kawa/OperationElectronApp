/* src/renderer/components/ui/badge/StatusBadge.css.ts */

import { style, styleVariants } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";
/* =========================
   Base
========================= */

export const badge = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",

  height: "28px",
  minWidth: "86px",
  padding: `0 ${tokens.space.md}`,

  borderRadius: tokens.radius.full,

  fontSize: tokens.font.size.xs,
  fontWeight: tokens.font.weight.bold,

  whiteSpace: "nowrap",
  textTransform: "uppercase",
  letterSpacing: "0.05em",

  backgroundColor: tokens.color.bg.base,

  border: "2px solid currentcolor",

  transition: `all ${tokens.transition.normal}`,
});

/* =========================
   Tone
========================= */

export const tone = styleVariants({
  success: {
    color: tokens.color.status.success,
    boxShadow: `${tokens.shadow.raised.low}, ${tokens.shadow.glow.success}`,
  },

  running: {
    color: tokens.color.status.running,
    boxShadow: `${tokens.shadow.raised.low}, ${tokens.shadow.glow.running}`,
  },

  ready: {
    color: tokens.color.status.ready,
    boxShadow: `${tokens.shadow.raised.low}, ${tokens.shadow.glow.ready}`,
  },

  waiting: {
    color: tokens.color.status.waiting,
    boxShadow: `${tokens.shadow.raised.low}, ${tokens.shadow.glow.waiting}`,
  },

  scriptRunning: {
    color: tokens.color.status.running,
    boxShadow: `${tokens.shadow.raised.low}, ${tokens.shadow.glow.running}`,
  },

  scheduled: {
    color: tokens.color.status.scheduled,
    boxShadow: `${tokens.shadow.raised.low}, ${tokens.shadow.glow.scheduled}`,
  },

  error: {
    color: tokens.color.status.error,
    boxShadow: `${tokens.shadow.raised.low}, ${tokens.shadow.glow.error}`,
  },

  neutral: {
    color: tokens.color.text.base,
    boxShadow: tokens.shadow.raised.low,
  },
});
