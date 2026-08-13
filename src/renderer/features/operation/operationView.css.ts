// src/renderer/features/operation/operationView.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

// ============================================================
// Common
// ============================================================

const baseFlexCol = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
});

// ============================================================
// Operation View
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

// ============================================================
// Table Area
// ============================================================

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

// ============================================================
// Side Panel Area
// ============================================================

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

export const panelContainer = style([
  baseFlexCol,
  {
    gap: tokens.space.lg,

    "@media": {
      "screen and (max-width: 1024px)": {
        flexDirection: "row",
      },

      "screen and (max-width: 768px)": {
        flexDirection: "column",
      },
    },
  },
]);
