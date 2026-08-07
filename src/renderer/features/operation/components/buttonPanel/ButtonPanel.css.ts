// src/renderer/features/operation/components/buttonPanel/ButtonPanel.css.ts
import { style } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

export const actionsCard = style([
  themeTransition,
  {
    backgroundColor: tokens.color.bg.base,
    boxShadow: tokens.shadow.raised.high,
    display: "flex",
    flexDirection: "column",
    gap: tokens.space.lg,
    padding: tokens.space.md,
    borderRadius: tokens.radius.lg,
  },
]);

export const modeToggleContainer = style({
  position: "relative",
  display: "flex",
  padding: tokens.space.xs,
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.pressed.high,
  overflow: "hidden",
});

export const modeToggleSlider = style({
  position: "absolute",
  top: tokens.space.xs,
  left: tokens.space.xs,
  width: "33.3333%",
  height: "calc(100% - 8px)",
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.raised.high,
  transition: `transform ${tokens.transition.ease}`,
  selectors: {
    // ⭕ 修正の要: `data-mode` 属性の判定をフロントエンドの新しい定義（小文字リテラル）に完全同期します
    [`${modeToggleContainer}[data-mode='operation'] &`]: {
      transform: "translateX(0%)",
    },
    [`${modeToggleContainer}[data-mode='irregular'] &`]: {
      transform: "translateX(100%)",
    },
    [`${modeToggleContainer}[data-mode='today'] &`]: {
      transform: "translateX(200%)",
    },
  },
});

export const modeToggleButton = style({
  flex: 1,
  position: "relative",
  zIndex: 1,
  padding: "0.5rem",
  border: "none",
  outline: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  lineHeight: 1.2,
  color: tokens.color.text.base,
  transition: `color ${tokens.transition.fast}`,
  selectors: {
    "&[data-active='true']": {
      color: tokens.color.text.base,
    },
  },
});

export const toggleText = style({
  display: "inline-block",
  transition: "color 240ms ease",
  selectors: {
    [`${modeToggleButton}[data-active='true'] &`]: {
      backgroundImage: tokens.gradient.brand,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      WebkitTextFillColor: "transparent",
      color: "transparent",
      transitionDelay: "140ms",
    },
  },
});

export const buttonGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
  gap: tokens.space.sm,
});

export const actionButton = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "48px",
    borderRadius: tokens.radius.md,
    border: "none",
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    cursor: "pointer",
    transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,
    backgroundColor: "transparent",
    selectors: {
      "&:not(:disabled)": {
        backgroundColor: tokens.color.bg.base,
        boxShadow: tokens.shadow.raised.low,
      },
      "&:not(:disabled):hover": {
        boxShadow: `${tokens.shadow.raised.low}, ${tokens.shadow.glow.brand}`,
      },
      "&:disabled": {
        color: tokens.color.text.base,
        opacity: 0.3,
        cursor: "not-allowed",
      },
      "&:not(:disabled):active": {
        boxShadow: tokens.shadow.pressed.low,
        transform: "translateY(1px)",
      },
    },
  },
]);

export const actionButtonText = style({
  transition: `filter ${tokens.transition.normal}`,
  selectors: {
    [`${actionButton}:not(:disabled) &`]: {
      backgroundImage: tokens.gradient.brand,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
    },
  },
});
