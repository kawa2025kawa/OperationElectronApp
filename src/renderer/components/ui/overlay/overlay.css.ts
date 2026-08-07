import { style, keyframes, styleVariants } from "@vanilla-extract/css";
import { tokens, glassBackdrop } from "@renderer/styles/tokens";

/* =========================================
   Animations
   ========================================= */
const blink = keyframes({
  "0%, 80%, 100%": { opacity: 0 },
  "40%": { opacity: 1 },
});

const scanlineAnim = keyframes({
  "0%": { transform: "translateY(-100%)" },
  "100%": { transform: "translateY(100%)" },
});

const flicker = keyframes({
  "0%, 100%": { opacity: 1 },
  "50%": { opacity: 0.4 },
});

/* =========================================
   Base Overlay & Layout Styles
   ========================================= */
export const overlayBase = style({
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
  open: { opacity: 1, visibility: "visible", pointerEvents: "auto" },
  closed: { opacity: 0, visibility: "hidden", pointerEvents: "none" },
});

export const fullScreenLoaderBase = style({
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.88)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  color: tokens.color.accent.base,
  fontFamily: tokens.font.mono,

  /* 🎯 修正: モーダル・ツールチップの上の最前面トークンを指定 */
  zIndex: tokens.zIndex.globalOverlay,
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
   Loading Content Display Styles
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
    "linear-gradient(to bottom, transparent, rgba(0,255,225,0.06), transparent)",
  animation: `${scanlineAnim} 2s linear infinite`,
  pointerEvents: "none",
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
   Status Panel (Right Bottom)
   ========================================= */
export const statusPanel = style({
  position: "absolute",
  bottom: "2rem",
  right: "2.5rem",
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.sm,
  fontSize: tokens.font.size.xs,
  letterSpacing: "0.05em",
  zIndex: tokens.zIndex.content,
  padding: tokens.space.lg,
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
  info: { color: tokens.color.status.running },
});
