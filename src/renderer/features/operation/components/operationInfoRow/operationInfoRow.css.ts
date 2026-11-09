// src/renderer/features/operation/components/operationInfoRow/operationInfoRow.css.ts

import { style, globalStyle } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

const t = tokens.transition.normal;

// ============================================================
// Info Row
// ============================================================
export const row = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  width: `calc(100% - ${tokens.space.sm} * 2)`,
  marginInline: "auto",
  boxSizing: "border-box",
  padding: `${tokens.space.sm} ${tokens.space.md}`,
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.md,
  color: tokens.color.text.base,
  boxShadow: tokens.shadow.raised.low,
  transition: `color ${t}, background-color ${t}`,
  minHeight: "44px",
  // 外部からのリペイント波及を遮断
  isolation: "isolate",
  transform: "translateZ(0)",

  // 🎯 完成形シャドウを固定描画した擬似要素レイヤー
  "::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    borderRadius: tokens.radius.md,
    boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
    opacity: 0,
    transition: `opacity ${t}`,
    pointerEvents: "none",
    willChange: "opacity",
  },

  selectors: {
    "&:hover": {
      color: tokens.color.text.hover,
    },
    "&:hover::before": {
      opacity: 1,
    },
    "&[data-remarks='true']": {
      flexDirection: "column",
      alignItems: "flex-start",
      height: "auto",
      gap: tokens.space.xs,
    },
  },
});

globalStyle(`${row} > span:first-child`, {
  position: "relative",
  zIndex: 1,
  flexShrink: 0,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  whiteSpace: "nowrap",
});

// ============================================================
// Result Value
// ============================================================
export const resultValue = style({
  position: "relative",
  zIndex: 1,
  flex: 1,
  paddingLeft: tokens.space.md,
  textAlign: "right",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.medium,

  selectors: {
    [`${row}[data-remarks='true'] &`]: {
      width: "100%",
      paddingLeft: 0,
      marginTop: tokens.space.xs,
      textAlign: "left",
      whiteSpace: "pre-wrap",
      wordBreak: "break-all",
      lineHeight: 1.6,
      maxHeight: "160px",
      overflowY: "auto",
      overflowX: "hidden",
      scrollbarWidth: "thin",
      scrollbarColor: `${tokens.color.accent.neonPink} transparent`,
    },
    [`${row}[data-remarks='true'] &::-webkit-scrollbar`]: {
      width: "4px",
      display: "block",
    },
    [`${row}[data-remarks='true'] &::-webkit-scrollbar-track`]: {
      backgroundColor: "transparent",
    },
    [`${row}[data-remarks='true'] &::-webkit-scrollbar-thumb`]: {
      backgroundColor: tokens.color.accent.neonPink,
      borderRadius: tokens.radius.full,
    },
    [`${row}[data-remarks='true'] &::-webkit-scrollbar-thumb:hover`]: {
      backgroundColor: tokens.color.accent.neonPink,
    },
  },
});
