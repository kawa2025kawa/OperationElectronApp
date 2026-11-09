// src/renderer/features/spreadSheet/components/modal/scheduleModalContent.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

export const contentContainer = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  gap: tokens.space.sm,
  padding: "4px",
  boxSizing: "border-box",
  color: tokens.color.text.base,
  fontSize: tokens.font.fluid.md,
  isolation: "isolate",
});

export const profileCard = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.space.sm,
    padding: tokens.space.sm,
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.raised.md,
    boxSizing: "border-box",
    flexShrink: 0,
    color: tokens.color.text.base,
    isolation: "isolate",
  },
]);

export const profileGrid = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: tokens.space.xs,
  flex: 1,
  minWidth: 0,
  isolation: "isolate",
});

export const profileItem = style([
  themeTransition,
  {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    padding: `${tokens.space.xs} ${tokens.space.sm}`,
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.low,
    fontSize: tokens.font.fluid.md,
    fontWeight: tokens.font.weight.bold,
    whiteSpace: "nowrap",
    color: tokens.color.text.base,
    isolation: "isolate",
    transform: "translateZ(0)",
    transition: `color ${tokens.transition.fast}`,

    "::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      borderRadius: tokens.radius.md,
      boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      opacity: 0,
      transition: `opacity ${tokens.transition.normal}`,
      pointerEvents: "none",
      willChange: "opacity",
    },

    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
      },
      "&:hover::before": {
        opacity: 1,
      },
    },
  },
]);

export const tableGrid = style([
  themeTransition,
  {
    position: "relative",
    display: "grid",
    flex: 1,
    minHeight: 0,
    gridTemplateColumns: "minmax(80px, 1.2fr) minmax(60px, 1fr) 2.5fr 3.5fr",
    padding: tokens.space.sm,
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.raised.md,
    boxSizing: "border-box",
    overflow: "hidden",
    color: tokens.color.text.base,
    isolation: "isolate",
    transform: "translateZ(0)",
    transition: `color ${tokens.transition.fast}`,

    "::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      borderRadius: tokens.radius.lg,
      boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.high}`,
      opacity: 0,
      transition: `opacity ${tokens.transition.normal}`,
      pointerEvents: "none",
      willChange: "opacity",
    },

    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
      },
      "&:hover::before": {
        opacity: 1,
      },
    },
  },
]);

const baseCell = style([
  themeTransition,
  {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2px 4px",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.sm,
    boxSizing: "border-box",
    fontSize: tokens.font.fluid.md,
    fontWeight: tokens.font.weight.bold,
    minWidth: 0,
    overflow: "hidden",
  },
]);

export const label = style({
  fontSize: tokens.font.fluid.md,
  fontWeight: tokens.font.weight.medium,
  color: tokens.color.text.base,
  opacity: 0.8,
  whiteSpace: "nowrap",
});

export const value = style({
  fontSize: tokens.font.fluid.md,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap",
});

export const cell = styleVariants({
  date: [
    baseCell,
    {
      gridRow: "span 3",
      flexDirection: "column",
      gap: "2px",
      borderRadius: tokens.radius.md,
      boxShadow: tokens.shadow.pressed.md,
    },
  ],
  header: [
    baseCell,
    {
      color: tokens.color.text.hover,
      boxShadow: "none",
      borderRadius: 0,
    },
  ],
  section: [
    baseCell,
    {
      color: tokens.color.accent.base,
      boxShadow: tokens.shadow.pressed.low,
    },
  ],
  data: [
    baseCell,
    {
      color: tokens.color.text.base,
      wordBreak: "break-all",
      boxShadow: tokens.shadow.pressed.low,
    },
  ],
});
