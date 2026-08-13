// src/renderer/features/operation/components/modal/contents/scriptModal/scriptModalContent.css.ts
import { style } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

export const container = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  gap: "2vmin",
  minHeight: 0,
});

export const mainMessage = style([
  themeTransition,
  {
    fontSize: "clamp(14px, 2.5vmin, 22px)",
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text.base,
    textAlign: "center",
    margin: 0,
    padding: "1vmin 0",
  },
]);

export const gridBox = style({
  flex: 1,
  minHeight: 0,
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(6, 1fr)",
  gap: "1.5vmin",
  overflowY: "auto",
  padding: "2vmin",
  boxSizing: "border-box",
  alignContent: "start",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.lg,
  boxShadow: tokens.shadow.pressed.md,
});

export const dropAreaContainer = style({
  width: "100%",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
});
