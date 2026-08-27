// src/renderer/features/spreadSheet/components/modal/tantou/TantouModalContent.css.ts
import { style } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

export const mainContainer = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: 0,
  gap: tokens.space.md,
});

export const contentContainer = style({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  gap: tokens.space.md,
  padding: "4px",
  boxSizing: "border-box",
});

export const tabContainer = style({
  display: "flex",
  width: "100%",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.lg,
  boxShadow: tokens.shadow.pressed.md,
  padding: "8px",
  flexShrink: 0,
  boxSizing: "border-box",
  gap: "4px",
});

export const button = style([
  themeTransition,
  {
    border: "none",
    cursor: "pointer",
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    fontWeight: tokens.font.weight.bold,
    outline: "none",
    boxShadow: tokens.shadow.raised.low,
    borderRadius: tokens.radius.md,
    padding: "8px 16px",
    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      },
      "&:active": {
        boxShadow: tokens.shadow.pressed.low,
      },
      '&[data-variant="tab"]': {
        flex: 1,
        padding: "10px 16px",
        borderRadius: tokens.radius.sm,
        backgroundColor: "transparent",
        fontSize: "clamp(12px, 1.8vmin, 15px)",
        whiteSpace: "nowrap",
        boxShadow: "none",
      },
      '&[data-variant="tab"][data-active="true"]': {
        backgroundColor: tokens.color.bg.base,
        color: tokens.color.accent.base,
        boxShadow: tokens.shadow.raised.md,
      },
    },
  },
]);

export const gridContainer = style({
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gridAutoRows: "1fr",
  gap: "16px",
  width: "100%",
  height: "100%",
  minHeight: 0,
  boxSizing: "border-box",
});

export const card = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "16px 20px",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.md,
    boxSizing: "border-box",
    height: "100%",
    minHeight: 0,
    selectors: {
      "&:hover": {
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.high}`,
        transform: "translateY(-1px)",
      },
    },
  },
]);

export const label = style({
  fontSize: "clamp(12px, 1.8vmin, 15px)",
  fontWeight: tokens.font.weight.medium,
  color: tokens.color.text.base,
  opacity: 0.7,
  marginBottom: "8px",
  transition: `color ${tokens.transition.ease}, opacity ${tokens.transition.ease}`,
  selectors: {
    [`${card}:hover &`]: {
      color: tokens.color.text.hover,
      opacity: 1,
    },
  },
});

export const value = style({
  fontSize: "clamp(14px, 2.2vmin, 20px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  wordBreak: "break-all",
  textAlign: "center",
  transition: `color ${tokens.transition.ease}`,
  selectors: {
    [`${card}:hover &`]: {
      color: tokens.color.text.hover,
    },
  },
});
