import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

export const toastTone = {
  success: style({ color: tokens.color.status.success }),
  error: style({ color: tokens.color.status.error }),
  info: style({ color: tokens.color.accent.neonCyan }),
  warning: style({ color: tokens.color.status.running }),
} as const;
