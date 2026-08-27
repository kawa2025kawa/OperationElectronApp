// src\renderer\components\ui\toast\pollingToast.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

export const panel = style([
  themeTransition,
  {
    position: "fixed",
    top: "110px",
    right: "25px",
    bottom: "100px",
    width: "min(28vw, 520px)",
    maxHeight: "75vh",
    display: "flex",
    flexDirection: "column",
    gap: tokens.space.xs,
    zIndex: tokens.zIndex.toast,
    padding: tokens.space.xs,
    boxSizing: "border-box",
    borderRadius: tokens.radius.lg,
    border: `2px solid ${tokens.color.border.subtle}`,
    backgroundColor: tokens.glass.surface,
    backdropFilter: "blur(12px) saturate(180%)",
    WebkitBackdropFilter: "blur(12px) saturate(180%)",
    boxShadow: tokens.shadow.raised.high,
    isolation: "isolate",
    overflowY: "auto",
    scrollbarWidth: "none",
    selectors: {
      "&::-webkit-scrollbar": {
        display: "none",
      },
    },
  },
]);

export const header = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",

  flexShrink: 0,
  gap: tokens.space.md,

  padding: `${tokens.space.xs} ${tokens.space.sm}`,
  marginBottom: tokens.space.xs,

  borderBottom: `1px solid ${tokens.color.border.default}`,
});

export const title = style({
  color: tokens.color.text.base,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  whiteSpace: "nowrap",
});

export const list = style({
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.xs,
  width: "100%",
});

export const item = style([
  themeTransition,
  {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: tokens.space.md,

    width: "100%",
    padding: `${tokens.space.sm} ${tokens.space.md}`,
    boxSizing: "border-box",

    borderRadius: tokens.radius.sm,
    border: `1px solid ${tokens.color.border.subtle}`,

    backgroundColor: "transparent",
    boxShadow: tokens.shadow.raised.low,

    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,

    transition: `
      box-shadow ${tokens.transition.ease},
      color ${tokens.transition.ease},
      background-color ${tokens.transition.ease},
      transform ${tokens.transition.fast}
    `,

    selectors: {
      "&:hover": {
        backgroundColor: tokens.color.bg.inset,
        transform: "translateX(2px)",
        boxShadow: tokens.shadow.raised.md,
      },
    },
  },
]);

export const closeButton = style({
  appearance: "none",

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  padding: tokens.space.xs,

  border: "none",
  outline: "none",
  background: "transparent",

  color: tokens.color.text.base,
  opacity: 0.6,

  cursor: "pointer",
  fontSize: tokens.font.size.sm,

  transition: `opacity ${tokens.transition.fast}`,

  selectors: {
    "&:hover": {
      opacity: 1,
    },

    "&:focus-visible": {
      opacity: 1,
      outline: `1px solid ${tokens.color.border.default}`,
      borderRadius: tokens.radius.sm,
    },
  },
});

export const icon = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",

  flexShrink: 0,

  width: "1.25em",

  fontSize: tokens.font.size.md,
  fontWeight: tokens.font.weight.bold,
});

export const message = style({
  flex: 1,
  minWidth: 0,

  color: "inherit",

  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
});

export const tone = styleVariants({
  success: {
    color: tokens.color.status.success,
  },

  error: {
    color: tokens.color.status.error,
  },

  warning: {
    color: tokens.color.status.waiting,
  },

  info: {
    color: tokens.color.status.ready,
  },
});
