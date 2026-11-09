// src/renderer/features/operation/components/modal/summaryModal/summaryModalContent.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

// OperationTable のテーブルスタイルを継承
export * from "../../table/operationTable.css";

// モーダル全体のルートコンテナ
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

// テーブル自体の外枠コンテナ
export const tableContainer = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  outline: "none",
});
