// src/renderer/features/spreadSheet/components/modal/scheduleModalContent.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import {
  interactiveGlowCard,
  textEllipsis,
} from "@renderer/styles/global/surfaces.css";

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

export const profileCard = style({
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
});

export const profileGrid = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: tokens.space.xs,
  flex: 1,
  minWidth: 0,
});

export const profileItem = style([
  interactiveGlowCard,
  {
    display: "inline-flex",
    alignItems: "center",
    padding: `${tokens.space.xs} ${tokens.space.sm}`,
    fontSize: tokens.font.fluid.md,
    fontWeight: tokens.font.weight.bold,
    whiteSpace: "nowrap",
  },
]);

export const tableGrid = style([
  interactiveGlowCard,
  {
    display: "grid",
    flex: 1,
    minHeight: 0,
    gridTemplateColumns: "minmax(80px, 1.2fr) minmax(60px, 1fr) 2.5fr 3.5fr",
    padding: tokens.space.sm,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.raised.md,
    boxSizing: "border-box",
    overflow: "hidden",
  },
]);

const baseCell = style({
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
});

export const label = style({
  fontSize: tokens.font.fluid.md,
  fontWeight: tokens.font.weight.medium,
  color: "inherit",
  opacity: 0.8,
  whiteSpace: "nowrap",
});

export const value = style([
  textEllipsis,
  {
    fontSize: tokens.font.fluid.md,
    fontWeight: tokens.font.weight.bold,
    color: "inherit",
  },
]);

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
      color: "inherit",
      wordBreak: "break-all",
      boxShadow: tokens.shadow.pressed.low,
    },
  ],
});
