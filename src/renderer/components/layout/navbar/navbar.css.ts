// src/renderer/components/layout/navbar/navbar.css.ts

import { style } from "@vanilla-extract/css";
import {
  tokens,
  themeTransition,
  brandGradientText,
  titleText,
} from "@renderer/styles/tokens";

export const container = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    height: "80px",
    paddingInline: tokens.space.lg,
    gap: tokens.space.xl,
    backgroundColor: tokens.color.bg.base,
    boxShadow: tokens.shadow.raised.high,
    zIndex: tokens.zIndex.content,

    // 🎯 描画分離（GPU合成レイヤーによるペイント範囲の限定）
    position: "relative",
    isolation: "isolate",
    transform: "translateZ(0)",
  },
]);

export const logoText = style([
  brandGradientText,
  titleText,
  {
    fontSize: tokens.font.size.xl,
    whiteSpace: "nowrap",
    flexShrink: 0,

    "@media": {
      "screen and (max-width: 850px)": {
        display: "none",
      },
    },
  },
]);

export const centerItem = style({
  flex: 1,
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const centerSummaryWrapper = style({
  width: "80%",
  flexShrink: 1,
  minWidth: 0,

  // 🎯 ウインドウ幅が狭い場合のレイアウト崩れ防止（サマリー非表示化）
  "@media": {
    "screen and (max-width: 900px)": {
      display: "none",
    },
  },
});

export const summaryPlaceholder = style([
  centerSummaryWrapper,
  {
    height: "48px",
  },
]);

export const rightGroup = style({
  display: "flex",
  alignItems: "center",
  gap: tokens.space.md,

  flexShrink: 0,
});
