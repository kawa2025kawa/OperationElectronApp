// src/renderer/layout/mainView.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

export const appContainer = style({
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  width: "100vw",
  backgroundColor: tokens.color.bg.base,
  overflow: "hidden",
  position: "relative",
});

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

export const viewPane = styleVariants({
  active: {
    display: "block",
    width: "100%",
    height: "100%",
  },
  hidden: {
    display: "none",
    width: "100%",
    height: "100%",
  },
});

export const unknownViewContainer = style({
  padding: tokens.space.xl,
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.md,
});