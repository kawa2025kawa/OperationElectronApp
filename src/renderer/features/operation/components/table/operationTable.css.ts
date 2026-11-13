// src/renderer/features/operation/components/table/operationTable.css.ts

import { keyframes, style, styleVariants } from "@vanilla-extract/css";

import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

const transition = tokens.transition.normal;

const commonTable = {
  width: "100%",
  tableLayout: "fixed",
  borderCollapse: "separate",
} satisfies Parameters<typeof style>[0];

const rowEdgeRadius = {
  "tr > &:first-child": {
    borderRadius: `${tokens.radius.md} 0 0 ${tokens.radius.md}`,
  },
  "tr > &:last-child": {
    borderRadius: `0 ${tokens.radius.md} ${tokens.radius.md} 0`,
  },
};

const scrollbar = {
  scrollbarWidth: "thin",
  scrollbarColor: `${tokens.color.accent.neonPink} transparent`,
  selectors: {
    "&::-webkit-scrollbar": {
      width: "4px",
      height: "4px",
      display: "block",
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: tokens.color.accent.neonPink,
      borderRadius: tokens.radius.full,
    },
    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor: tokens.color.accent.neonPink,
    },
  },
} satisfies Parameters<typeof style>[0];

export const container = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  outline: "none",
  isolation: "isolate",
});

export const headerContainer = style({
  position: "relative",
  zIndex: 2,
  flexShrink: 0,
  width: "100%",
  overflow: "hidden",
  paddingInline: tokens.space.md,
  scrollbarGutter: "stable",
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.raised.high,
});

export const scrollContainer = style({
  position: "relative",
  zIndex: 0,
  flex: 1,
  minHeight: 0,
  width: "100%",
  overflow: "auto",
  paddingInline: tokens.space.md,
  scrollbarGutter: "stable",
  isolation: "isolate",
  ...scrollbar,
});

export const table = style({
  ...commonTable,
  borderSpacing: `0 ${tokens.space.md}`,
});

export const headerTable = style({
  ...commonTable,
  borderSpacing: 0,
});

export const thead = style({
  backgroundColor: tokens.color.bg.base,
});

export const headerRow = style({
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.raised.high,
});

export const tableRowBase = style([
  themeTransition,
  {
    height: "56px",
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    boxShadow: tokens.shadow.raised.low,
    outline: "none",
    transition: `color ${tokens.transition.fast}, box-shadow ${transition}`,

    selectors: {
      "&:focus, &:focus-visible": {
        outline: "none",
      },
      "&[data-context-open='true']": {
        color: tokens.color.text.hover,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.high}`,
      },
    },
  },
]);

export const tableRowStates = styleVariants({
  idle: {},

  clickable: {
    cursor: "pointer",
    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.high}`,
      },
      "&:active": {
        boxShadow: tokens.shadow.pressed.low,
      },
    },
  },

  selected: {
    boxShadow: tokens.shadow.pressed.low,
  },

  disabled: {
    opacity: 0.5,
    pointerEvents: "none",
    filter: "grayscale(0.8)",
  },
});

export const thBase = style([
  themeTransition,
  {
    height: "56px",
    paddingInline: tokens.space.lg,
    backgroundColor: tokens.color.bg.base,
    borderBottom: `1px solid ${tokens.color.border.subtle}`,
    color: tokens.color.text.base,
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    selectors: rowEdgeRadius,
  },
]);

export const tdBase = style({
  position: "relative",
  zIndex: 1,
  paddingInline: tokens.space.lg,
  color: "inherit",
  fontSize: tokens.font.size.md,
  fontWeight: tokens.font.weight.medium,
  selectors: rowEdgeRadius,
});

export const alignVariants = styleVariants({
  left: { textAlign: "left" },
  center: { textAlign: "center" },
  right: { textAlign: "right" },
});

export const cellText = style({
  display: "inline-block",
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
  transition: `color ${transition}, filter ${transition}`,

  selectors: {
    [`${tableRowStates.selected} &`]: {
      backgroundImage: tokens.gradient.brand,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
      WebkitTextFillColor: "transparent",
    },
  },
});

export const statusCellWrapper = style({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  cursor: "context-menu",
});

export const statusBadgeAnchor = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: tokens.radius.full,
  transition: `transform ${tokens.transition.fast}, filter ${tokens.transition.fast}`,

  selectors: {
    "&[data-context-open='true']": {
      transform: "scale(1.04)",
      filter: "drop-shadow(0 0 8px rgba(0, 220, 255, 0.85))",
    },
  },
});

export const modeContent = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: 0,
});

export const emptyCell = style({
  height: "240px",
  verticalAlign: "middle",
});

const loadingSweep = keyframes({
  "0%": { transform: "translateX(-100%)" },
  "100%": { transform: "translateX(260%)" },
});

export const loadingContainer = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: tokens.space.md,
  width: "100%",
  height: "100%",
  minHeight: "200px",
});

export const loadingLabel = style({
  fontFamily: tokens.font.mono,
  fontSize: tokens.font.size.xs,
  fontWeight: tokens.font.weight.bold,
  letterSpacing: "0.28em",
  color: tokens.color.accent.neonCyan,
  textShadow: tokens.shadow.glow.cyan,
});

export const loadingBarTrack = style({
  position: "relative",
  width: "min(320px, 60%)",
  height: "6px",
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.pressed.low,
  border: `1px solid ${tokens.color.border.default}`,
  overflow: "hidden",
});

export const loadingBarFill = style({
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  width: "38%",
  borderRadius: tokens.radius.full,
  backgroundImage: tokens.gradient.brand,
  boxShadow: tokens.shadow.glow.cyan,
  animation: `${loadingSweep} 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
  willChange: "transform",
});

const laserBeamPulse = keyframes({
  "0%, 100%": { opacity: 0.9 },
  "50%": { opacity: 1 },
});

const laserNodePulse = keyframes({
  "0%, 100%": {
    transform: "scale(1)",
    opacity: 0.95,
  },
  "50%": {
    transform: "scale(1.35)",
    opacity: 1,
  },
});

export const laserOverlay = style({
  position: "fixed",
  inset: 0,
  width: "100vw",
  height: "100vh",
  pointerEvents: "none",
  zIndex: `calc(${tokens.zIndex.contextMenu} + 1)`,
  overflow: "visible",
});

export const laserGlowPath = style({
  fill: "none",
  stroke: tokens.color.accent.neonCyan,
  strokeWidth: 5,
  strokeLinecap: "round",
  opacity: 0.32,
  filter: "blur(3px)",
});

export const laserCorePath = style({
  fill: "none",
  stroke: tokens.color.accent.neonCyan,
  strokeWidth: 1.75,
  strokeLinecap: "round",
  filter: "drop-shadow(0 0 6px rgba(0, 220, 255, 0.95))",
  animation: `${laserBeamPulse} 1.6s ease-in-out infinite`,
});

export const laserHighlightPath = style({
  fill: "none",
  stroke: "#ffffff",
  strokeWidth: 0.9,
  strokeLinecap: "round",
  opacity: 0.85,
});

export const laserNode = style({
  fill: "#ffffff",
  stroke: tokens.color.accent.neonCyan,
  strokeWidth: 2,
  filter: "drop-shadow(0 0 6px rgba(0, 220, 255, 1))",
  transformBox: "fill-box",
  transformOrigin: "center",
  animation: `${laserNodePulse} 1.4s ease-in-out infinite`,
});
