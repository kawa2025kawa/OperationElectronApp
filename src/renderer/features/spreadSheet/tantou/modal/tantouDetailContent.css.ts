// src/renderer/features/spreadSheet/tantou/modal/tantouDetailContent.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

import {
  interactiveGlowCard,
  textEllipsis,
} from "@renderer/styles/global/surfaces.css";

const flexColumn = {
  display: "flex",
  flexDirection: "column" as const,
};

const elevatedLayer = {
  position: "relative" as const,
  zIndex: 1,
};

export const detailList = style({
  ...flexColumn,
  gap: "6px",
  width: "100%",
});

export const detailRow = style([
  interactiveGlowCard,
  {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    boxSizing: "border-box",
  },
]);

export const fieldLabel = style({
  ...elevatedLayer,
  display: "flex",
  alignItems: "center",
  flexShrink: 0,
  boxSizing: "border-box",
  width: tokens.size.badgeWidth,
  height: "36px",
  paddingLeft: "16px",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.sm,
  boxShadow: tokens.shadow.pressed.md,
  fontSize: "15px",
  fontWeight: tokens.font.weight.bold,
});

export const fieldValueContainer = style({
  ...elevatedLayer,
  ...flexColumn,
  justifyContent: "center",
  flex: 1,
  minWidth: 0,
});

export const fieldValue = style([
  textEllipsis,
  {
    fontSize: tokens.font.fluid.md,
    fontWeight: tokens.font.weight.bold,
  },
]);