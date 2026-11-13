// src/renderer/layout/mainView.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

export const appContainer = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100vw",
    backgroundColor: tokens.color.bg.base,
    overflow: "hidden",
    position: "relative",
  },
]);

export const contentWrapper = style({
  display: "flex",
  flex: 1,
  width: "100%",
  minHeight: 0,
  position: "relative",
  isolation: "isolate",
});

export const mainContent = style({
  flex: 1,
  height: "100%",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  position: "relative",
  zIndex: 10,
  isolation: "isolate",
});

export const viewWrapper = style({
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  position: "relative",
  isolation: "isolate",
  overflow: "hidden",
});
