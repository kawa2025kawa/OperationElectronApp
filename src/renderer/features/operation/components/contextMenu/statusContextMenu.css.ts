//src\renderer\features\operation\components\contextMenu\statusContextMenu.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";
import { contextMenuTokens } from "@renderer/styles/tokens/component/contextMenu.tokens";

/* =========================
   Header & Content Container
========================= */
export const content = style({
  minWidth: "160px",
  padding: tokens.space.xs,
  borderRadius: tokens.radius.lg,
  backgroundColor: "rgba(0, 0, 0, 0.45)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "2px solid rgba(0, 0, 0, 0.6)",
  boxShadow: tokens.shadow.raised.high,
  zIndex: contextMenuTokens.zIndex + 1,
  isolation: "isolate",
  animationDuration: "150ms",
  animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
  willChange: "transform, opacity",
});

export const header = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: `${tokens.space.xs} ${tokens.space.sm}`,
  borderBottom: `1px solid ${tokens.color.border.default}`,
  marginBottom: tokens.space.xs,
  gap: tokens.space.md,
});

export const headerTitle = style({
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  whiteSpace: "nowrap",
});

/* =========================
   Menu Item (ベース定義)
========================= */
export const itemBase = style({
  appearance: "none",
  display: "flex",
  alignItems: "center",
  width: "100%",
  border: "none",
  outline: "none",
  background: "none",
  padding: `${tokens.space.sm} ${tokens.space.md}`,
  borderRadius: tokens.radius.sm,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  textAlign: "left",
  cursor: "pointer",
  transition: `
    box-shadow ${tokens.transition.ease},
    color ${tokens.transition.ease},
    background-color ${tokens.transition.ease},
    transform ${tokens.transition.fast}
  `,
  selectors: {
    "&[data-highlighted]": {
      backgroundColor: tokens.color.bg.inset,
      transform: "translateX(2px)",
    },
  },
});

/* =========================
   Menu Item バリアント
========================= */
export const itemVariants = styleVariants({
  SCHEDULED: { color: tokens.color.status.scheduled },
  RUNNING: { color: tokens.color.status.running },
  scriptRunning: { color: tokens.color.status.running },
  SUCCESS: { color: tokens.color.status.success },
  READY: { color: tokens.color.status.ready },
  WAITING: { color: tokens.color.status.waiting },
  ERROR: { color: tokens.color.status.error },
});
