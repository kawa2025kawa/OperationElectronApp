// src/renderer/features/operation/components/contextMenu/statusContextMenu.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { JOB_STATUS } from "@shared/types/operation/operationTypes";

export const content = style({
  minWidth: "160px",
  padding: tokens.space.xs,
  borderRadius: tokens.radius.lg,

  // 🎯 すりガラス感を残す濃色アルファ
  backgroundColor: "rgba(18, 20, 24, 0.1)",

  // 🎯 背後をしっかりぼかすフロスト効果
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",

  // 🎯 外線を黒い縁（ダークボーダー）にする
  border: "1px solid #000000",

  // 🎯 黒い縁取りをより引き締め、立体感を出すドロップシャドウ
  boxShadow:
    "0 0 0 1px rgba(0, 0, 0, 0.8), 0 12px 36px rgba(0, 0, 0, 0.7), 0 4px 12px rgba(0, 0, 0, 0.5)",
  zIndex: tokens.zIndex.contextMenu,

  // 描画隔離
  position: "relative",
  isolation: "isolate",
  transform: "translateZ(0)",
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
