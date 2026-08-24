// src/renderer/features/remoteDesktop/rdpView.css.ts

import { style } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

export const rdpContainer = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    gap: tokens.space.md,
    padding: tokens.space.xl,
    height: "100%",
    width: "100%",
    boxSizing: "border-box",
    overflowY: "auto",
  },
]);

export const grid = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: tokens.space.lg,
  width: "100%",
});

export const card = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.space.xs,
    padding: tokens.space.xl,
    minHeight: "140px",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.raised.low,
    border: "none",
    outline: "none",
    cursor: "pointer",

    transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,
    selectors: {
      "&:hover": {
        boxShadow: tokens.shadow.glow.cyan,
      },
    },
  },
]);

export const cardTitle = style({
  fontSize: tokens.font.size.lg,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.hover,
  textAlign: "center",
  wordBreak: "break-all",
  transition: `color ${tokens.transition.normal}`,
  selectors: {
    // 💡 card ホバー時のタイトル色
    [`${card}:hover &`]: {
      color: tokens.color.accent.base,
    },
  },
});

export const cardHost = style({
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.normal,
  color: tokens.color.text.base,
  opacity: 0.8,
  transition: `color ${tokens.transition.normal}`,
  selectors: {
    // 💡 card ホバー時のホスト名色
    [`${card}:hover &`]: {
      color: tokens.color.text.hover,
      opacity: 1,
    },
  },
});
