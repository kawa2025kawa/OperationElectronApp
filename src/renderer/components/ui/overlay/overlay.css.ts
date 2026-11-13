// src/renderer/components/ui/overlay/overlay.css.ts

import { style, keyframes, styleVariants } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

/* =========================================
   Constants
========================================= */

const OVERLAY_FADE_DURATION = "450ms";
const OVERLAY_FADE_EASING = "ease";

const BACKDROP_BACKGROUND = "rgba(0, 0, 0, 0.7)";
const BACKDROP_BLUR = "blur(12px)";

const TARGET_SWEEP_DURATION = "4s";

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

const targetMaterialize = keyframes({
  "0%": {
    opacity: 0,
    transform: "translateY(4px)",
  },
  "100%": {
    opacity: 1,
    transform: "translateY(0)",
  },
});

const targetPulse = keyframes({
  "0%, 100%": {
    opacity: 0.85,
    textShadow:
      "0 0 4px rgba(210, 255, 255, 0.3), 0 0 10px rgba(0, 255, 225, 0.16)",
  },
  "50%": {
    opacity: 1,
    textShadow:
      "0 0 6px rgba(235, 255, 255, 0.65), 0 0 14px rgba(0, 255, 225, 0.32)",
  },
});

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
   Shared Styles
========================================= */

const fixedOverlayLayout = {
  position: "fixed" as const,
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const overlayFadeTransition = `opacity ${OVERLAY_FADE_DURATION} ${OVERLAY_FADE_EASING}`;

const backdropTransition = [
  overlayFadeTransition,
  `visibility 0s linear ${OVERLAY_FADE_DURATION}`,
].join(", ");

const backdropOpenTransition = [overlayFadeTransition, "visibility 0s"].join(
  ", ",
);

/* =========================================
   Backdrop Overlay
========================================= */

const overlayBase = style({
  ...fixedOverlayLayout,
  zIndex: tokens.zIndex.overlay,
});

export const backdropBase = style([
  overlayBase,
  {
    backgroundColor: BACKDROP_BACKGROUND,
    backdropFilter: BACKDROP_BLUR,
    WebkitBackdropFilter: BACKDROP_BLUR,
    transition: backdropTransition,
    willChange: "opacity",
  },
]);

export const backdropStates = styleVariants({
  open: {
    opacity: 1,
    visibility: "visible",
    pointerEvents: "auto",
    transition: backdropOpenTransition,
  },
  closed: {
    opacity: 0,
    visibility: "hidden",
    pointerEvents: "none",
  },
});

/* =========================================
   Full Screen Loader
========================================= */

export const fullScreenLoaderBase = style({
  ...fixedOverlayLayout,
  overflow: "hidden",
  background: "rgba(0, 0, 0, 0.88)",
  color: tokens.color.accent.base,
  fontFamily: tokens.font.mono,
  zIndex: tokens.zIndex.globalOverlay,
  willChange: "opacity",
});

export const fullScreenLoaderStates = styleVariants({
  active: {
    opacity: 1,
    pointerEvents: "auto",
    transition: overlayFadeTransition,
  },
  inactive: {
    opacity: 0,
    pointerEvents: "none",
    transition: overlayFadeTransition,
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
    "linear-gradient(to bottom, transparent, rgba(0, 255, 225, 0.06), transparent)",
  animation: `${scanlineAnim} 2s linear infinite`,
  pointerEvents: "none",
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
    "linear-gradient(90deg, rgba(0, 255, 225, 0.07), rgba(0, 255, 225, 0.015) 55%, transparent)",
  animation: `${targetMaterialize} 400ms cubic-bezier(0.16, 1, 0.3, 1) both`,

  selectors: {
    "&::before": {
      content: '""',
      position: "absolute",
      left: "-2px",
      top: 0,
      bottom: 0,
      width: "2px",
      background:
        "linear-gradient(to bottom, transparent, rgba(220, 255, 255, 0.95), transparent)",
      boxShadow: "0 0 10px rgba(0, 255, 225, 0.4)",
      pointerEvents: "none",
    },
    "&::after": {
      content: '""',
      position: "absolute",
      inset: "-10px -30px",
      background:
        "linear-gradient(105deg, transparent 35%, rgba(220, 255, 255, 0.1) 48%, transparent 58%)",
      pointerEvents: "none",
      animation: `${targetSweep} ${TARGET_SWEEP_DURATION} ease-in-out infinite`,
      willChange: "transform, opacity",
    },
  },
});

export const processingTargetLabel = style({
  position: "relative",
  zIndex: 1,
  fontSize: "10px",
  fontWeight: 400,
  letterSpacing: "0.42em",
  textTransform: "uppercase",
  color: "rgba(190, 225, 225, 0.38)",
});

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
    "0 0 5px rgba(220, 255, 255, 0.45), 0 0 14px rgba(0, 255, 225, 0.22)",
  animation: `
    ${targetPulse} 2.8s ease-in-out infinite,
    ${targetGlitch} 5s steps(1, end) infinite
  `,
});
