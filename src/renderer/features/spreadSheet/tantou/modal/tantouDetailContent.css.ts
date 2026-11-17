// src/renderer/features/spreadSheet/tantou/modal/tantouDetailContent.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

import {
  focusRing,
  interactiveGlowCard,
  textEllipsis,
} from "@renderer/styles/global/surfaces.css";

const t = tokens.transition.normal;

const flexColumn = {
  display: "flex",
  flexDirection: "column" as const,
};

const elevatedLayer = {
  position: "relative" as const,
  zIndex: 1,
};

export const container = style({
  ...flexColumn,
  width: "100%",
  height: "100%",
  minHeight: 0,
  gap: tokens.space.md,
  isolation: "isolate",
});

export const tabBar = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  width: "100%",
  height: tokens.size.controlHeight,
  padding: tokens.space.xs,
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.pressed.high,
  boxSizing: "border-box",
  flexShrink: 0,
  isolation: "isolate",
});

export const tabSlider = style({
  position: "absolute",
  inset: 0,
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.bg.base,
  boxShadow: `${tokens.shadow.glowRaised.high}, ${tokens.shadow.pressed.low}`,
  zIndex: 0,
  transform: "translateZ(0)",
  willChange: "transform",
  pointerEvents: "none",
});

export const tabButton = style([
  focusRing,
  {
    ...elevatedLayer,
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "0 0.75rem",
    border: "none",
    borderRadius: tokens.radius.full,
    outline: "none",
    cursor: "pointer",
    backgroundColor: "transparent",
    fontFamily: tokens.font.base,
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text.base,
    transition: `color ${t}`,
    whiteSpace: "nowrap",

    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
      },
    },
  },
]);

export const buttonText = style({
  ...elevatedLayer,
  transition: `color ${t}`,
  selectors: {
    [`${tabButton}[data-active] &`]: {
      backgroundImage: tokens.gradient.brand,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
    },
  },
});

export const listContainer = style([
  {
    ...flexColumn,
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    gap: tokens.space.md,
    padding: "4px",
    boxSizing: "border-box",
    isolation: "isolate",
    scrollbarGutter: "stable",
  },
]);

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
