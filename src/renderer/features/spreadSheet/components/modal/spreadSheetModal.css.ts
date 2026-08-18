import { style } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

export const modalContainer = style({
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  zIndex: tokens.zIndex.modal,
  width: "80vw",
  maxWidth: "800px",
  maxHeight: "85vh",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.lg,
  boxShadow: tokens.shadow.raised.high,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

export const pressedSection = style([
  themeTransition,
  {
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.pressed.md,
    overflow: "hidden",
    display: "flex",
    width: "100%",
  },
]);

export const modalWrapper = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  width: "100%",
  padding: "3vmin",
  boxSizing: "border-box",
  gap: "2vmin",
});

export const modalHeader = style([
  pressedSection,
  {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1vmin 2vmin",
    flexShrink: 0,
    boxSizing: "border-box",
  },
]);

export const modalTitle = style({
  fontSize: "clamp(18px, 3.5vmin, 32px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  margin: 0,
});

export const contactInfo = style({
  display: "flex",
  gap: "2vmin",
  fontSize: "clamp(12px, 2.2vmin, 22px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
});

export const scheduleLinkButton = style({
  padding: "1vmin 2vmin",
  borderRadius: tokens.radius.md,
  backgroundColor: tokens.color.bg.base,
  color: tokens.color.accent.base,
  fontSize: "clamp(11px, 1.8vmin, 16px)",
  fontWeight: tokens.font.weight.bold,
  border: "none",
  boxShadow: tokens.shadow.raised.md,
  cursor: "pointer",
  transition: tokens.transition.fast,
  selectors: {
    "&:hover": {
      boxShadow: tokens.shadow.glow.cyan,
      transform: "translateY(-1px)",
    },
    "&:active": {
      boxShadow: tokens.shadow.pressed.low,
      transform: "translateY(0)",
    },
  },
});

export const tabContainer = style({
  display: "flex",
  gap: "1vmin",
  padding: "1vmin",
  flexShrink: 0,
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.md,
  boxShadow: tokens.shadow.pressed.md,
});

export const tabButton = style({
  flex: 1,
  padding: "1vmin 2vmin",
  borderRadius: tokens.radius.sm,
  border: "none",
  backgroundColor: "transparent",
  color: tokens.color.text.base,
  fontSize: "clamp(12px, 2vmin, 16px)",
  fontWeight: tokens.font.weight.bold,
  cursor: "pointer",
  transition: tokens.transition.fast,
  whiteSpace: "nowrap",
  selectors: {
    "&:hover": {
      color: tokens.color.text.hover,
      boxShadow: tokens.shadow.glow.cyan,
    },
    '&[data-active="true"]': {
      backgroundColor: tokens.color.bg.base,
      color: tokens.color.accent.base,
      boxShadow: tokens.shadow.raised.md,
    },
  },
});

export const modalContentContainer = style([
  pressedSection,
  {
    flex: 1,
    padding: "3vmin",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "2vmin",
    minHeight: 0,
    boxSizing: "border-box",
  },
]);

export const gridContainer = style({
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gridAutoRows: "1fr",
  gap: "2vmin",
  width: "100%",
  height: "100%",
  flex: 1,
});

// 🎯 モーダル内のカード要素のベーススタイル（共通定義）
export const infoBlock = style({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  padding: "1.5vmin",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.md,
  boxShadow: tokens.shadow.raised.md,
  transition: tokens.transition.fast,
  height: "100%", // 🎯 親要素の高さにジャストフィット
  boxSizing: "border-box", // 🎯 padding によるハミ出し防止
  selectors: {
    "&:hover": {
      boxShadow: tokens.shadow.glow.cyan,
    },
  },
});

export const fullWidthBlock = style([
  infoBlock,
  {
    gridColumn: "1 / -1",
  },
]);

// 🎯 scheduleRow は infoBlock を継承し、固有の5列グリッドのレイアウト差分のみを定義
export const scheduleRow = style([
  infoBlock,
  {
    display: "grid",
    gridTemplateColumns: "1.2fr 1.5fr 3fr 1.5fr 3fr",
    gap: "2vmin",
    padding: "2.5vmin",
    alignItems: "stretch",
  },
]);

export const infoLabel = style({
  fontSize: "clamp(12px, 2vmin, 16px)",
  fontWeight: tokens.font.weight.medium,
  color: tokens.color.text.base,
  opacity: 0.8,
  marginBottom: "0.5vmin",
});

export const infoValue = style({
  fontSize: "clamp(14px, 2.5vmin, 24px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  wordBreak: "break-all",
});

export const dateLabelBlock = style({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.md,
  boxShadow: tokens.shadow.pressed.md,
  padding: "1.5vmin",
  fontSize: "clamp(14px, 2.2vmin, 24px)",
  fontWeight: tokens.font.weight.bold,
  gap: "4px",
  height: "100%",
  boxSizing: "border-box",
});

export const dateSubLabel = style({
  fontSize: "clamp(11px, 1.8vmin, 15px)",
  fontFamily: tokens.font.mono,
  color: tokens.color.text.base,
  fontWeight: tokens.font.weight.medium,
});
