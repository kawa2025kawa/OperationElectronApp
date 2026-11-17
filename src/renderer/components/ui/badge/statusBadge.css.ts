// src/renderer/components/ui/badge/statusBadge.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { getStatusTheme } from "@renderer/styles/tokens/statusTheme";
import type { JobStatus } from "@shared/types/operation/operationTypes";

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
  position: "relative",
  isolation: "isolate",
});

const createTone = (status: JobStatus) => {
  const { color, glow } = getStatusTheme(status);
  return {
    color,
    boxShadow: `${tokens.shadow.raised.low}, ${glow}`,
  };
};

export const tone = styleVariants({
  success: createTone("success"),
  running: createTone("running"),
  scriptRunning: createTone("scriptRunning"),
  ready: createTone("ready"),
  waiting: createTone("waiting"),
  scheduled: createTone("scheduled"),
  needsAction: createTone("needsAction"),
  error: createTone("error"),
  neutral: {
    color: tokens.color.text.base,
    boxShadow: tokens.shadow.raised.low,
  },
});
