// src/renderer/features/spreadSheet/tantou/modal/tantouDetailContent.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

// 他コンポーネントと共通の 0.8秒イージング
const smoothGlow = "0.8s cubic-bezier(0.25, 0.8, 0.25, 1)";
const t = tokens.transition.normal;

const detailRowBase = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 16px",
  boxSizing: "border-box" as const,
};

export const container = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: 0,
  gap: tokens.space.md,
});

// ============================================================
// Tab Switcher Container & Slider
// ============================================================
export const tabBar = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  width: "100%",
  height: "40px",
  padding: tokens.space.xs,
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.pressed.high,
  boxSizing: "border-box",
  flexShrink: 0,
});

export const tabSlider = style({
  position: "absolute",
  inset: 0,
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.raised.high,
  zIndex: 0,

  // シアンの光（外側グロー）とインセット影を重ねるレイヤー
  "::before": {
    content: '""',
    position: "absolute",
    inset: -1,
    borderRadius: tokens.radius.full,
    boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.pressed.low}`,
    opacity: 1,
    transition: `opacity ${smoothGlow}`,
    pointerEvents: "none",
  },
});

export const tabButton = style({
  flex: 1,
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  padding: "0 0.75rem",
  border: "none",
  borderRadius: tokens.radius.full,
  outline: "none",
  cursor: "pointer",
  backgroundColor: "transparent",
  fontFamily: tokens.font.base,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  transition: `color ${t}`,
  whiteSpace: "nowrap",

  // 押し込み（scale）は排除し、非アクティブ時のホバーで文字色を強調
  selectors: {
    "&:hover": {
      color: tokens.color.text.hover,
    },
  },
});

export const buttonText = style({
  position: "relative",
  zIndex: 1,
  transition: `color ${t}`,
  selectors: {
    [`${tabButton}[data-active="true"] &`]: {
      backgroundImage: tokens.gradient.brand,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
    },
  },
});

// ============================================================
// Detail List & Rows
// ============================================================
export const listContainer = style({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  gap: tokens.space.md,
  padding: "4px",
  boxSizing: "border-box",
});

export const detailList = style({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  width: "100%",
});

export const detailRow = style([
  themeTransition,
  detailRowBase,
  {
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.low,
    selectors: {
      "&:hover": {
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
        color: tokens.color.text.hover,
      },
    },
  },
]);

export const fieldLabel = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  flexShrink: 0,
  boxSizing: "border-box",
  width: "120px",
  height: "36px",
  paddingLeft: "16px",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.sm,
  boxShadow: tokens.shadow.pressed.md,
  color: tokens.color.accent.base,
  fontSize: "15px",
  fontWeight: tokens.font.weight.bold,
});

export const fieldValueContainer = style({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  flex: 1,
  minWidth: 0,
});

export const fieldValue = style({
  overflow: "hidden",
  color: tokens.color.text.base,
  fontSize: tokens.font.fluid.md,
  fontWeight: tokens.font.weight.bold,
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  transition: tokens.transition.fast,
  selectors: {
    [`${detailRow}:hover &`]: {
      color: tokens.color.text.hover,
    },
  },
});

