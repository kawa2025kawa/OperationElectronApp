// src/renderer/features/operation/operationView.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

// ============================================================
// Common Base
// ============================================================

const baseFlexCol = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
});

// ============================================================
// Operation View Layout
// ============================================================

export const container = style({
  display: "flex",
  width: "100%",
  height: "100%",
  padding: tokens.space.sm,
  gap: tokens.space.md,
  boxSizing: "border-box",
  backgroundColor: tokens.color.bg.base,
  transition: `background-color ${tokens.transition.normal}`,

  "@media": {
    "screen and (max-width: 1024px)": {
      flexDirection: "column",
    },
  },
});

export const tableArea = style([
  baseFlexCol,
  {
    flex: 7,
    minWidth: 0,

    "@media": {
      "screen and (max-width: 1024px)": {
        flex: 1,
      },
    },
  },
]);

export const tableCard = style([
  baseFlexCol,
  {
    flex: 1,
    overflow: "hidden",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.raised.high,
  },
]);

export const panelArea = style([
  baseFlexCol,
  {
    flex: 3,
    minWidth: "320px",

    "@media": {
      "screen and (max-width: 1024px)": {
        flex: "none",
        minWidth: "0",
        height: "300px",
      },
      "screen and (max-width: 768px)": {
        height: "auto",
      },
    },
  },
]);

// ============================================================
// Panel Container & Top Controls
// ============================================================

export const panelContainer = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
    height: "100%",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.raised.high,
    padding: tokens.space.md,
    gap: tokens.space.xl,
  },
]);

export const topControls = style({
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.sm,
  flexShrink: 0,
});

// ============================================================
// Info List
// ============================================================

export const infoList = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    paddingTop: tokens.space.xs,
    paddingBottom: tokens.space.xs,
    gap: tokens.space.md,
  },
]);
