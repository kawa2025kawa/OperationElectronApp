// src/renderer/components/layout/footer/components/footerActionButton.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

// 0.8秒かけてふわっと光らせるイージング
const smoothGlow = "0.8s cubic-bezier(0.25, 0.8, 0.25, 1)";
const t = tokens.transition.normal;

export const actionButton = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "42px",
  height: "42px",
  borderRadius: tokens.radius.full,
  border: `1px solid ${tokens.color.border.default}`,
  outline: "none",
  cursor: "pointer",
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.raised.md,
  // 位置変化（transform）は一切含めず、背景・枠線・影のみ遷移
  transition: `background-color ${t}, border-color ${smoothGlow}, box-shadow ${t}`,

  // シアンの光（外側グロー）とインセット影を重ねるレイヤー
  "::before": {
    content: '""',
    position: "absolute",
    inset: -1,
    borderRadius: tokens.radius.full,
    boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.pressed.low}`,
    opacity: 0,
    transition: `opacity ${smoothGlow}`,
    pointerEvents: "none",
  },

  selectors: {
    // ホバー時に 0.8秒かけてふわっと光らせる
    "&:hover::before": {
      opacity: 1,
    },
    // ON (isActive) 状態のスタイル
    "&[aria-pressed='true']": {
      borderColor: tokens.color.border.accent,
    },
    "&[aria-pressed='true']::before": {
      opacity: 1,
    },
  },
});

export const actionButtonText = style({
  position: "relative",
  zIndex: 1,
  fontSize: tokens.font.size.xs,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  transition: `color ${t}`,

  selectors: {
    [`${actionButton}[aria-pressed='true'] &`]: {
      color: tokens.color.accent.base,
    },
  },
});

