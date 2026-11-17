// src/renderer/features/operation/components/modal/summaryModal/summaryModalContent.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

import { textEllipsis } from "@renderer/styles/global/surfaces.css";

export * from "../../table/operationTable.css";

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

export const tableContainer = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
  outline: "none",
});

export const headerWrapper = style({
  position: "relative",
  zIndex: 10,
  flexShrink: 0,
  paddingInline: tokens.space.md,
  borderRadius: tokens.radius.md,
  boxShadow: tokens.shadow.raised.high,
  isolation: "isolate",
});

export const bodyWrapper = style([
  {
    position: "relative",
    zIndex: 0,
    flex: 1,
    minHeight: 0,
    overflowX: "hidden",
    overflowY: "auto",
    paddingInline: tokens.space.md,
    paddingTop: tokens.space.sm,
    scrollbarGutter: "stable",
    isolation: "isolate",
  },
]);

export const headerTable = style({
  width: "100%",
  tableLayout: "fixed",
  borderCollapse: "separate",
  borderSpacing: 0,
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.md,
});

export const bodyTable = style({
  width: "100%",
  tableLayout: "fixed",
  borderCollapse: "separate",
  borderSpacing: `0 ${tokens.space.md}`,
});

export const cellText = style([
  textEllipsis,
  {
    display: "inline-block",
    maxWidth: "100%",
    verticalAlign: "middle",
  },
]);
