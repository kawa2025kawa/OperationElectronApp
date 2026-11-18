// src/renderer/features/operation/components/contextMenu/statusContextMenu.css.ts

import { style, styleVariants } from "@vanilla-extract/css";

import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { JOB_STATUS } from "@shared/types/operation/operationTypes";

export const positioner = style({
  zIndex: tokens.zIndex.contextMenu,
});

export const content = style({
  position: "relative",
  zIndex: tokens.zIndex.base,
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gridTemplateRows: "auto auto auto auto",
  gap: tokens.space.sm,
  minWidth: "340px",
  padding: tokens.space.md,
  borderRadius: tokens.radius.lg,
  boxSizing: "border-box",

  border: `1px solid ${tokens.glass.contextMenu.border}`,
  backgroundColor: tokens.glass.contextMenu.surface,
  backdropFilter: `blur(${tokens.glass.contextMenu.blur}) saturate(${tokens.glass.contextMenu.saturation})`,
  boxShadow: tokens.shadow.contextMenu,
});

// 1段目: KanriNo + 右上 CloseButton（4列貫通）
export const rowKanriNo = style({
  gridColumn: "1 / -1",
  gridRow: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: tokens.space.sm,
  paddingLeft: tokens.space.xs,
  minHeight: "38px",
  fontFamily: tokens.font.mono,
  fontSize: tokens.font.size.lg,
  fontWeight: 800,
  color: tokens.color.accent.neonCyan,
  letterSpacing: "0.06em",
  whiteSpace: "nowrap",
});

export const closeButtonCompact = style({
  width: "30px",
  height: "30px",
  fontSize: "1.15rem",
});

// 2段目: WorkName（4列貫通）
export const rowWorkName = style({
  gridColumn: "1 / -1",
  gridRow: 2,
  padding: `0 ${tokens.space.xs} ${tokens.space.sm}`,
  marginBottom: tokens.space.xs,
  borderBottom: `1px solid ${tokens.color.border.default}`,
  color: tokens.color.text.hover,
  fontSize: tokens.font.size.lg,
  fontWeight: tokens.font.weight.bold,
  lineHeight: 1.35,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const itemBase = style({
  appearance: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  width: "100%",
  height: "42px",
  padding: "0 6px",
  border: "1px solid transparent",
  borderRadius: tokens.radius.sm,
  outline: "none",
  backgroundColor: "rgba(255, 255, 255, 0.03)",
  color: "inherit",
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  cursor: "pointer",
  transition: `color ${tokens.transition.ease}, background-color ${tokens.transition.ease}, border-color ${tokens.transition.ease}`,

  selectors: {
    "&[data-highlighted]": {
      backgroundColor: tokens.color.bg.frostedGlass,
      borderColor: tokens.color.border.highlight,
      boxShadow: tokens.shadow.highlight,
    },
    "&[data-current='true']": {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderColor: "currentcolor",
    },
  },
});

export const currentIndicator = style({
  fontFamily: tokens.font.mono,
  fontSize: tokens.font.size.xs,
  lineHeight: 1,
  opacity: 0.95,
});

export const itemVariants = styleVariants({
  [JOB_STATUS.SCHEDULED]: {
    color: tokens.color.status.scheduled,
  },
  [JOB_STATUS.RUNNING]: {
    color: tokens.color.status.running,
  },
  [JOB_STATUS.SCRIPT_RUNNING]: {
    color: tokens.color.status.running,
  },
  [JOB_STATUS.SUCCESS]: {
    color: tokens.color.status.success,
  },
  [JOB_STATUS.READY]: {
    color: tokens.color.status.ready,
  },
  [JOB_STATUS.WAITING]: {
    color: tokens.color.status.waiting,
  },
  [JOB_STATUS.NEEDS_ACTION]: {
    color: tokens.color.status.needsAction,
  },
  [JOB_STATUS.ERROR]: {
    color: tokens.color.status.error,
  },
});
