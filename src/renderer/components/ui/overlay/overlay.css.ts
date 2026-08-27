import { style, keyframes, styleVariants } from "@vanilla-extract/css";
import { tokens, glassBackdrop } from "@renderer/styles/tokens";

/* =========================================
   Animations
========================================= */

const blink = keyframes({
  "0%, 80%, 100%": {
    opacity: 0,
  },
  "40%": {
    opacity: 1,
  },
});

const scanlineAnim = keyframes({
  "0%": {
    transform: "translateY(-100%)",
  },
  "100%": {
    transform: "translateY(100%)",
  },
});

const flicker = keyframes({
  "0%, 100%": {
    opacity: 1,
  },
  "50%": {
    opacity: 0.4,
  },
});

/* =========================================
   Processing Target Animations
========================================= */

/**
 * Target表示開始時のマテリアライズ。
 *
 * 最初だけblurを使用し、
 * 表示後はfilterを使わないことで常時描画負荷を抑える。
 */
const targetMaterialize = keyframes({
  "0%": {
    opacity: 0,
    transform: "scaleX(1.06) translateY(4px)",
    filter: "blur(4px)",
    letterSpacing: "0.28em",
  },
  "45%": {
    opacity: 0.75,
    transform: "scaleX(1.015) translateY(0)",
    filter: "blur(1px)",
    letterSpacing: "0.18em",
  },
  "100%": {
    opacity: 1,
    transform: "scaleX(1) translateY(0)",
    filter: "blur(0)",
    letterSpacing: "0.12em",
  },
});

/**
 * Targetの微細な明滅。
 *
 * 強くしすぎず、既存のOverlayの
 * cyan glowと馴染ませる。
 */
const targetPulse = keyframes({
  "0%, 100%": {
    opacity: 0.82,
    textShadow:
      "0 0 4px rgba(210, 255, 255, 0.3), " + "0 0 10px rgba(0, 255, 225, 0.16)",
  },
  "50%": {
    opacity: 1,
    textShadow:
      "0 0 5px rgba(235, 255, 255, 0.65), " +
      "0 0 14px rgba(0, 255, 225, 0.32)",
  },
});

/**
 * ごく短いPV風のglitch。
 *
 * 常時動かすのではなく、約5秒に1回だけ発生。
 */
const targetGlitch = keyframes({
  "0%, 92%, 100%": {
    transform: "translateX(0)",
  },
  "93%": {
    transform: "translateX(-1px)",
  },
  "94%": {
    transform: "translateX(2px)",
  },
  "95%": {
    transform: "translateX(-1px)",
  },
  "96%": {
    transform: "translateX(0)",
  },
});

/**
 * Target領域を横切る光。
 */
const targetSweep = keyframes({
  "0%": {
    transform: "translateX(-140%) skewX(-20deg)",
    opacity: 0,
  },
  "12%": {
    opacity: 0.55,
  },
  "42%": {
    opacity: 0.15,
  },
  "65%, 100%": {
    transform: "translateX(240%) skewX(-20deg)",
    opacity: 0,
  },
});

/* =========================================
   Base Overlay & Layout
========================================= */

const overlayBase = style({
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: tokens.zIndex.overlay,
  transition: `opacity ${tokens.transition.normal}, visibility ${tokens.transition.normal}`,
});

export const backdropBase = style([
  overlayBase,
  glassBackdrop,
  {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
]);

export const backdropStates = styleVariants({
  open: {
    opacity: 1,
    visibility: "visible",
    pointerEvents: "auto",
  },

  closed: {
    opacity: 0,
    visibility: "hidden",
    pointerEvents: "none",
  },
});

export const fullScreenLoaderBase = style({
  position: "fixed",
  inset: 0,

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  overflow: "hidden",

  background: "rgba(0, 0, 0, 0.88)",

  color: tokens.color.accent.base,
  fontFamily: tokens.font.mono,

  zIndex: tokens.zIndex.globalOverlay,

  /**
   * GPU compositingを促してOverlay全体の
   * opacity transitionを安定させる。
   */
  willChange: "opacity",
});

export const fullScreenLoaderStates = styleVariants({
  active: {
    opacity: 1,
    pointerEvents: "auto",
    transition: `opacity ${tokens.transition.normal}`,
  },

  inactive: {
    opacity: 0,
    pointerEvents: "none",
    transition: `opacity ${tokens.transition.normal}`,
  },
});

/* =========================================
   Loading Content
========================================= */

export const contentWrapper = style({
  position: "relative",

  width: "100%",
  height: "100%",

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  overflow: "hidden",

  color: tokens.color.accent.base,
  fontFamily: tokens.font.mono,
  fontSize: tokens.font.size.md,
});

export const grid = style({
  position: "absolute",
  inset: 0,

  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const scanline = style({
  position: "absolute",
  inset: 0,

  background:
    "linear-gradient(" +
    "to bottom, " +
    "transparent, " +
    "rgba(0, 255, 225, 0.06), " +
    "transparent" +
    ")",

  animation: `${scanlineAnim} 2s linear infinite`,

  pointerEvents: "none",

  /**
   * アニメーション対象をtransformに限定。
   */
  willChange: "transform",
});

export const content = style({
  position: "relative",

  zIndex: tokens.zIndex.under,

  textAlign: "center",
});

export const title = style({
  fontSize: tokens.font.size.xl,
  letterSpacing: "0.25em",

  textShadow: tokens.shadow.glow.cyan,

  animation: `${flicker} 1.5s infinite`,
});

export const dots = style({
  display: "flex",
  justifyContent: "center",

  gap: tokens.space.sm,

  marginTop: tokens.space.md,
});

export const dot = style({
  width: "6px",
  height: "6px",

  background: tokens.color.accent.base,

  borderRadius: tokens.radius.full,

  animation: `${blink} 1.2s infinite`,
});

export const status = style({
  marginTop: tokens.space.md,

  fontSize: tokens.font.size.sm,

  opacity: 0.7,

  letterSpacing: "0.15em",
});

/* =========================================
   Status Panel
========================================= */

export const statusPanel = style({
  position: "absolute",

  bottom: "2rem",
  right: "2.5rem",

  display: "flex",
  flexDirection: "column",

  gap: tokens.space.sm,

  padding: tokens.space.lg,

  fontSize: tokens.font.size.xs,
  letterSpacing: "0.05em",

  zIndex: tokens.zIndex.content,

  borderRight: `2px solid ${tokens.color.accent.base}`,

  backgroundColor: "transparent",

  backdropFilter: "none",
  WebkitBackdropFilter: "none",

  fontFamily: tokens.font.mono,
});

export const statusRow = style({
  display: "flex",
  justifyContent: "space-between",

  width: "260px",

  color: "rgba(0, 255, 225, 0.4)",

  borderBottom: `1px solid ${tokens.color.border.subtle}`,

  paddingBottom: tokens.space.xs,
});

export const tone = styleVariants({
  ok: {
    color: tokens.color.status.success,

    textShadow: "0 0 8px rgba(74, 222, 128, 0.8)",
  },

  ng: {
    color: tokens.color.status.error,

    textShadow: tokens.shadow.glow.error,
  },

  info: {
    color: tokens.color.status.running,
  },
});

/* =========================================
   Processing Target
========================================= */

/**
 * JC / Script実行対象。
 *
 * 左下に配置し、右下のStatus Panelと
 * 対称になるHUDレイアウト。
 */
export const processingTargetPanel = style({
  position: "absolute",

  left: "3rem",
  bottom: "3rem",

  display: "flex",
  flexDirection: "column",

  gap: tokens.space.xs,

  minWidth: "280px",
  maxWidth: "min(520px, 60vw)",

  padding: `${tokens.space.md} ${tokens.space.lg}`,

  zIndex: tokens.zIndex.content,

  overflow: "hidden",

  fontFamily: tokens.font.mono,

  borderLeft: `2px solid ${tokens.color.accent.base}`,

  background:
    "linear-gradient(" +
    "90deg, " +
    "rgba(0, 255, 225, 0.07), " +
    "rgba(0, 255, 225, 0.015) 55%, " +
    "transparent" +
    ")",

  animation:
    `${targetMaterialize} ` +
    "700ms " +
    "cubic-bezier(0.16, 1, 0.3, 1) " +
    "both",

  selectors: {
    /**
     * 左側の縦ラインを発光させる。
     */
    "&::before": {
      content: '""',

      position: "absolute",

      left: "-2px",
      top: 0,
      bottom: 0,

      width: "2px",

      background:
        "linear-gradient(" +
        "to bottom, " +
        "transparent, " +
        "rgba(220, 255, 255, 0.95), " +
        "transparent" +
        ")",

      boxShadow: "0 0 10px rgba(0, 255, 225, 0.4)",

      pointerEvents: "none",
    },

    /**
     * 横方向に走る光。
     */
    "&::after": {
      content: '""',

      position: "absolute",

      inset: "-10px -30px",

      background:
        "linear-gradient(" +
        "105deg, " +
        "transparent 35%, " +
        "rgba(220, 255, 255, 0.1) 48%, " +
        "transparent 58%" +
        ")",

      pointerEvents: "none",

      animation: `${targetSweep} 4s ease-in-out infinite`,

      willChange: "transform, opacity",
    },
  },
});

/**
 * PROCESSING TARGET
 */
export const processingTargetLabel = style({
  position: "relative",

  zIndex: 1,

  fontSize: "10px",
  fontWeight: 400,

  letterSpacing: "0.42em",

  textTransform: "uppercase",

  color: "rgba(190, 225, 225, 0.38)",
});

/**
 * Job ID / Work Name
 */
export const processingTargetValue = style({
  position: "relative",

  zIndex: 1,

  maxWidth: "100%",

  overflow: "hidden",

  whiteSpace: "nowrap",
  textOverflow: "ellipsis",

  fontSize: "clamp(18px, 2vw, 28px)",
  fontWeight: 300,

  lineHeight: 1.2,

  letterSpacing: "0.12em",

  color: "rgba(225, 255, 255, 0.92)",

  textShadow:
    "0 0 5px rgba(220, 255, 255, 0.45), " + "0 0 14px rgba(0, 255, 225, 0.22)",

  animation: `
    ${targetPulse} 2.8s ease-in-out infinite,
    ${targetGlitch} 5s steps(1, end) infinite
  `,
});
