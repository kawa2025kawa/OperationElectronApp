// src/renderer/features/spreadSheet/shop/modal/shopModalContent.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

import {
  interactiveGlowCard,
  textEllipsis,
} from "@renderer/styles/global/surfaces.css";

const BADGE_WIDTH = "60px";

const flexColumn = {
  display: "flex",
  flexDirection: "column" as const,
};

const elevatedLayer = {
  position: "relative" as const,
  zIndex: 1,
};

const rowBase = {
  display: "flex",
  alignItems: "center",
  gap: tokens.space.md,
  padding: "12px 16px",
};

const gridBase = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  flex: 1,
  gap: tokens.space.md,
  alignItems: "center",
};

export const trTabWrapper = style({
  ...flexColumn,
  flex: 1,
  minHeight: 0,
  gap: tokens.space.sm,
  overflow: "hidden",
});

export const terminalSection = style({
  ...flexColumn,
  gap: "6px",
  width: "100%",
});

export const trTerminalSection = style([
  terminalSection,
  {
    flex: 1,
    minHeight: 0,
    gap: tokens.space.xs,
    overflow: "hidden",
  },
]);

export const trRowsScrollArea = style({
  ...flexColumn,
  flex: 1,
  minHeight: 0,
  gap: tokens.space.sm,
  overflowY: "auto",
  overflowX: "hidden",
  padding: `${tokens.space.xs} ${tokens.space.sm} ${tokens.space.sm} ${tokens.space.xs}`,
  scrollbarGutter: "stable",
});

export const terminalHeaderRow = style({
  ...rowBase,
  flexShrink: 0,
  margin: `${tokens.space.xs} ${tokens.space.sm} ${tokens.space.xs} ${tokens.space.xs}`,
  padding: "10px 16px",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.md,
  boxShadow: tokens.shadow.raised.high,
  borderTop: `1px solid ${tokens.color.border.highlight}`,
  borderLeft: `1px solid ${tokens.color.border.default}`,
  borderRight: `1px solid ${tokens.color.border.subtle}`,
  borderBottom: `1px solid ${tokens.color.border.subtle}`,
  boxSizing: "border-box",
  fontSize: tokens.font.fluid.md,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
});

export const terminalHeaderBadge = style({
  width: BADGE_WIDTH,
  flexShrink: 0,
  textAlign: "center",
});

export const terminalHeaderGrid = style(gridBase);

export const terminalRow = style([
  interactiveGlowCard,
  rowBase,
  {
    flexShrink: 0,
    fontSize: tokens.font.fluid.md,
  },
]);

export const terminalBadge = style({
  ...elevatedLayer,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: BADGE_WIDTH,
  height: "36px",
  flexShrink: 0,
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.sm,
  boxShadow: tokens.shadow.pressed.md,
  fontWeight: tokens.font.weight.bold,
  letterSpacing: "0.5px",
});

export const nonTrBadge = style([
  terminalBadge,
  {
    width: tokens.size.badgeWidth,
    justifyContent: "flex-start",
    paddingLeft: "16px",
  },
]);

export const flexCell = style({
  ...elevatedLayer,
  ...flexColumn,
  justifyContent: "center",
  minWidth: 0,
  flex: 1,
});

export const terminalGrid = style({
  ...gridBase,
  ...elevatedLayer,
});

export const cellValue = style([
  textEllipsis,
  {
    fontWeight: tokens.font.weight.bold,
  },
]);

export const buttonContainer = style({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  flexShrink: 0,
  gap: tokens.space.md,
  padding: `${tokens.space.xs} ${tokens.space.md} ${tokens.space.md} ${tokens.space.xs}`,
});
