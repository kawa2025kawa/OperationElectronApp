// src/renderer/features/operation/components/modal/summaryModal/summaryModalContent.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

// OperationTable 共通スタイル
export * from "../../table/operationTable.css";

// -----------------------------------------------------------------------------
// Modal Container
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Header Wrapper
// -----------------------------------------------------------------------------

export const headerWrapper = style({
  position: "relative",
  zIndex: 10,
  flexShrink: 0,
  paddingInline: tokens.space.md,
  borderRadius: tokens.radius.md,
  boxShadow: tokens.shadow.raised.high,
  isolation: "isolate",
});

// -----------------------------------------------------------------------------
// Body Wrapper
// -----------------------------------------------------------------------------

export const bodyWrapper = style({
  position: "relative",
  zIndex: 0,
  flex: 1,
  minHeight: 0,
  overflowX: "hidden",
  overflowY: "auto",
  paddingInline: tokens.space.md,
  paddingTop: tokens.space.sm,
  scrollbarGutter: "stable",
  scrollbarWidth: "thin",
  scrollbarColor: `${tokens.color.accent.neonPink} transparent`,
  isolation: "isolate",

  selectors: {
    "&::-webkit-scrollbar": {
      width: "4px",
      display: "block",
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: tokens.color.accent.neonPink,
      borderRadius: tokens.radius.full,
    },
    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor: tokens.color.accent.neonPink,
    },
  },
});

// -----------------------------------------------------------------------------
// Header Table
// -----------------------------------------------------------------------------

export const headerTable = style({
  width: "100%",
  tableLayout: "fixed",
  borderCollapse: "separate",
  borderSpacing: 0,
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.md,
});

// -----------------------------------------------------------------------------
// Body Table
// -----------------------------------------------------------------------------

export const bodyTable = style({
  width: "100%",
  tableLayout: "fixed",
  borderCollapse: "separate",
  borderSpacing: `0 ${tokens.space.md}`,
});

// -----------------------------------------------------------------------------
// Cell Text
// -----------------------------------------------------------------------------

export const cellText = style({
  display: "inline-block",
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
});
