// src/renderer/features/operation/operationView.css.ts
import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

// 共通のレイアウトスタイルを抽出
const baseFlexCol = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
});

export const container = style({
  display: "flex",
  height: "100%",
  width: "100%",
  backgroundColor: tokens.color.bg.base,
  gap: tokens.space.md,
  padding: tokens.space.sm,
  boxSizing: "border-box",
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
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.raised.high,
    overflow: "hidden",
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

export const panelContainer = style([
  baseFlexCol,
  {
    gap: tokens.space.lg,
    "@media": {
      "screen and (max-width: 1024px)": {
        flexDirection: "row", // ベーススタイルの column を上書き
      },
      "screen and (max-width: 768px)": {
        flexDirection: "column",
      },
    },
  },
]);
