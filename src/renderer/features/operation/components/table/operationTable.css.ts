// src/renderer/features/operation/components/table/operationTable.css.ts

import { style } from "@vanilla-extract/css";

export {
  tableContainer as container,
  headerWrapper,
  bodyWrapper,
  headerTable,
  bodyTable,
  tableRowBase,
  tableRowStates,
  thBase,
  tdBase,
  alignVariants,
  cellText,
} from "@renderer/features/operation/styles/sharedTable.css";

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
