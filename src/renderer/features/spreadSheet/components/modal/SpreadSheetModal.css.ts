// src/renderer/features/spreadSheet/components/modal/SpreadSheetModal.css.ts
import { style } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

const insetBase = style([
  themeTransition,
  {
    width: "100%",
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.bg.base,
    boxShadow: tokens.shadow.pressed.md,
    border: `1px solid ${tokens.color.border.subtle}`,
    boxSizing: "border-box",
  },
]);

export const container = style({
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr) auto",
  width: "100%",
  height: "100%",
  padding: "3vmin",
  gap: "2vmin",
  boxSizing: "border-box",
  fontFamily: tokens.font.base,
});

export const header = style([
  insetBase,
  {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1vmin 2vmin",
    borderRadius: tokens.radius.lg,
    gap: tokens.space.md,
  },
]);

export const headerLeft = style({
  display: "flex",
  alignItems: "center",
  gap: tokens.space.md,
});

export const modalTitle = style({
  margin: 0,
  fontSize: "clamp(16px, 3vmin, 24px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.hover,
});

export const headerRightContainer = style({
  display: "flex",
  alignItems: "center",
  gap: tokens.space.md,
  marginLeft: "auto",
});

export const centerContent = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: 0,
  flex: 1,
  boxSizing: "border-box",
  overflow: "hidden",
});

export const actionContainer = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "2vmin",
  width: "100%",
  marginTop: "auto",
});

export const button = style([
  themeTransition,
  {
    border: "none",
    cursor: "pointer",
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    fontWeight: tokens.font.weight.bold,
    outline: "none",
    boxShadow: tokens.shadow.raised.low,
    borderRadius: tokens.radius.md,
    padding: "8px 16px",
    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      },
      "&:active": {
        boxShadow: tokens.shadow.pressed.low,
      },
    },
  },
]);

export const footerLeft = style({
  display: "flex",
  alignItems: "center",
  gap: "2vmin",
  marginRight: "auto", // 右側に寄っている「閉じる」ボタンと分けるために auto を指定
});
