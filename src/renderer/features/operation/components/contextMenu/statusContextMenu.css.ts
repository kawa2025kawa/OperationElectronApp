// src/renderer/features/operation/components/contextMenu/statusContextMenu.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

export const content = style({
  minWidth: "160px",
  padding: tokens.space.xs,
  borderRadius: tokens.radius.lg,
  backgroundColor: tokens.glass.surface,
  backdropFilter: "blur(12px) saturate(180%)",
  WebkitBackdropFilter: "blur(12px) saturate(180%)",
  border: `2px solid ${tokens.color.border.subtle}`,
  boxShadow: tokens.shadow.raised.high,
  zIndex: tokens.zIndex.contextMenu,
});

export const header = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: tokens.space.md,
  padding: `${tokens.space.xs} ${tokens.space.sm}`,
  marginBottom: tokens.space.xs,
  borderBottom: `1px solid ${tokens.color.border.default}`,
});

export const headerTitle = style({
  color: tokens.color.text.hover,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  whiteSpace: "nowrap",
});

export const itemBase = style({
  appearance: "none",
  display: "flex",
  alignItems: "center",
  width: "100%",
  padding: `${tokens.space.sm} ${tokens.space.md}`,
  border: "none",
  borderRadius: tokens.radius.sm,
  outline: "none",
  background: "none",
  color: "inherit",
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  textAlign: "left",
  cursor: "pointer",
  transition: `color ${tokens.transition.ease}, background-color ${tokens.transition.ease}`,
  selectors: {
    "&[data-highlighted]": {
      backgroundColor: tokens.color.bg.frostedGlass,
      boxShadow: tokens.shadow.highlight,
    },
  },
});

export const itemVariants = styleVariants({
  SCHEDULED: {
    color: tokens.color.status.scheduled,
  },
  RUNNING: {
    color: tokens.color.status.running,
  },
  SCRIPTRUNNING: {
    color: tokens.color.status.running,
  },
  SUCCESS: {
    color: tokens.color.status.success,
  },
  READY: {
    color: tokens.color.status.ready,
  },
  WAITING: {
    color: tokens.color.status.waiting,
  },
  ERROR: {
    color: tokens.color.status.error,
  },
});
