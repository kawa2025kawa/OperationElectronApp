// src/renderer/features/operation/components/modal/summaryModal/summaryModalContent.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

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
