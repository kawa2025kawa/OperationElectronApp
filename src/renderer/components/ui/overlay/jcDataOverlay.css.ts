// src/renderer/components/ui/overlay/jcDataOverlay.css.ts
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

const spin = keyframes({
  "0%": { transform: "rotate(0deg)" },
  "100%": { transform: "rotate(360deg)" },
});

/* =========================================
   Base Backdrop & Overlay
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
    backgroundColor: "rgba(0, 0, 0, 0.88)",
  },
]);

export const backdropStates = styleVariants({
  open: { opacity: 1, visibility: "visible", pointerEvents: "auto" },
  closed: { opacity: 0, visibility: "hidden", pointerEvents: "none" },
});

export const scanline = style({
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(to bottom, transparent, rgba(0,255,225,0.06), transparent)",
  animation: `${scanlineAnim} 2s linear infinite`,
  pointerEvents: "none",
});

/* =========================================
   Content Area & Frame
   ========================================= */
export const contentWrapper = style({
  position: "relative",
  zIndex: tokens.zIndex.content,
  width: "92vw",
  maxWidth: "1400px",
  minHeight: "80vh",
  display: "flex",
  flexDirection: "column",
  padding: "36px 48px",
  boxSizing: "border-box",
  color: tokens.color.accent.base,
  fontFamily: tokens.font.mono,
  backgroundColor: "transparent",
  border: `1px solid rgba(0, 255, 225, 0.4)`,
  borderRadius: tokens.radius.md,
  boxShadow:
    "0 0 30px rgba(0, 255, 225, 0.25), inset 0 0 15px rgba(0, 255, 225, 0.05)",
});

export const content = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  textAlign: "center",
  height: "100%",
  flex: 1,
});

/* 🎯 タイトルフォントを特大化 (24px -> 32px) */
export const title = style({
  fontSize: "32px",
  letterSpacing: "0.3em",
  color: tokens.color.accent.base,
  textShadow: tokens.shadow.glow.cyan,
  animation: `${flicker} 1.5s infinite`,
  fontWeight: "bold",
});

/* 🎯 サブステータスフォント拡大 (14px -> 18px) */
export const status = style({
  marginTop: tokens.space.sm,
  fontSize: "18px",
  color: "#d1d5db",
  letterSpacing: "0.12em",
});

export const dots = style({
  display: "flex",
  justifyContent: "center",
  gap: tokens.space.md,
  marginTop: tokens.space.md,
});

export const dot = style({
  width: "10px",
  height: "10px",
  background: tokens.color.accent.base,
  borderRadius: tokens.radius.full,
  animation: `${blink} 1.2s infinite`,
});

/* =========================================
   JC Data Grid Area (3列 × 迫力の特大フォント)
   ========================================= */
export const gridContainer = style({
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "32px 48px",
  margin: "32px 0",
  padding: "40px 48px",
  textAlign: "left",
  backgroundColor: "rgba(0, 255, 225, 0.02)",
  borderLeft: `5px solid ${tokens.color.accent.base}`,
  borderTop: `1px solid rgba(0, 255, 225, 0.25)`,
  borderBottom: `1px solid rgba(0, 255, 225, 0.25)`,
  borderRight: `1px solid rgba(0, 255, 225, 0.25)`,
  flex: 1,
  alignContent: "space-evenly",
});

export const gridItem = style({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "10px",
});

/* 🎯 ラベルフォント拡大 (12px -> 15px) */
export const gridItemLabel = style({
  fontSize: "15px",
  color: "rgba(0, 255, 225, 0.7)",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  fontWeight: 600,
});

/* 🎯 動的な値の文字を特大白ネオン化 (15px -> 20px) */
export const gridItemValue = style({
  fontSize: "20px",
  fontWeight: "bold",
  color: "#ffffff",
  letterSpacing: "0.08em",
  wordBreak: "break-all",
  textShadow: `
    0 0 8px rgba(255, 255, 255, 0.9),
    0 0 16px rgba(0, 255, 225, 0.6),
    0 0 24px rgba(0, 255, 225, 0.3)
  `,
});

/* =========================================
   Footer Buttons & Actions (フォント＆ボタン拡大)
   ========================================= */
export const buttonGroup = style({
  display: "flex",
  justifyContent: "flex-end",
  gap: "20px",
  marginTop: tokens.space.sm,
});

/* 🎯 CANCELボタン拡大 */
export const secondaryButton = style({
  padding: "12px 36px",
  fontSize: "15px",
  fontWeight: 600,
  fontFamily: tokens.font.mono,
  letterSpacing: "0.12em",
  borderRadius: tokens.radius.sm,
  backgroundColor: "transparent",
  color: "#9ca3af",
  border: `1px solid rgba(0, 255, 225, 0.3)`,
  cursor: "pointer",
  transition: `all ${tokens.transition.fast}`,
  selectors: {
    "&:hover:not(:disabled)": {
      backgroundColor: "rgba(0, 255, 225, 0.1)",
      color: "#ffffff",
      borderColor: "rgba(0, 255, 225, 0.6)",
    },
    "&:disabled": {
      opacity: 0.4,
      cursor: "not-allowed",
    },
  },
});

/* 🎯 EXECUTEボタン拡大 */
export const primaryButton = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: tokens.space.sm,
  padding: "12px 48px",
  fontSize: "15px",
  fontWeight: "bold",
  fontFamily: tokens.font.mono,
  letterSpacing: "0.18em",
  borderRadius: tokens.radius.sm,
  backgroundColor: "transparent",
  color: tokens.color.accent.base,
  border: `1px solid ${tokens.color.accent.base}`,
  cursor: "pointer",
  boxShadow: "0 0 20px rgba(0, 255, 225, 0.3)",
  transition: `all ${tokens.transition.fast}`,
  selectors: {
    "&:hover:not(:disabled)": {
      backgroundColor: tokens.color.accent.base,
      color: "#0a0f18",
      boxShadow: "0 0 30px rgba(0, 255, 225, 0.9)",
    },
    "&:disabled": {
      opacity: 0.4,
      cursor: "not-allowed",
      boxShadow: "none",
    },
  },
});

export const buttonSpinner = style({
  width: "16px",
  height: "16px",
  border: "2px solid rgba(0, 255, 225, 0.3)",
  borderTop: `2px solid ${tokens.color.accent.base}`,
  borderRadius: "50%",
  animation: `${spin} 0.6s linear infinite`,
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
