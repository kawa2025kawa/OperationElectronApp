// src/renderer/features/operation/components/table/operationTable.css.ts

import { style } from "@vanilla-extract/css";

export * from "@renderer/styles/global/table.css";

export const statusCellWrapper = style({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  cursor: "context-menu",
});

export const modeContent = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: 0,
});
