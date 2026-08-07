// src/renderer/features/operation/components/modal/contents/jcModal/jcModalContent.css.ts
import { style } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

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

export const container = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  gap: "2vmin",
  minHeight: 0,
});

export const mainMessage = style({
  fontSize: "clamp(14px, 2.5vmin, 22px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  textAlign: "center",
  margin: 0,
  padding: "0.5vmin 0",
});

export const gridBox = style([
  pressedSection,
  {
    flex: 1,
    height: "100%",
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: "1.5vmin",
    overflowY: "auto",
    padding: "2vmin",
    boxSizing: "border-box",
    alignContent: "start",
  },
]);
