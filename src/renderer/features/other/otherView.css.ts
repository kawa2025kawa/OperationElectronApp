//src\renderer\features\other\otherView.css.ts

import { style } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

export const container = style([
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
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.space.xl,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    boxShadow: tokens.shadow.raised.low,
    cursor: "pointer",
    minHeight: "140px",
    border: "none",
    outline: "none",

    // 💡 タイトル用のフォント・テキストスタイルを直接統合
    fontSize: tokens.font.size.lg,
    fontWeight: tokens.font.weight.bold,
    textAlign: "center",
    wordBreak: "break-all",

    transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,
    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
        boxShadow: tokens.shadow.glow.cyan,
      },
    },
  },
]);
