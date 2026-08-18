// src/renderer/components/layout/footer/footer.css.ts

import { style } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

export const footerContainer = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",

    height: "4.5rem",
    padding: `0 ${tokens.space.lg}`,

    flexShrink: 0,

    backgroundColor: tokens.color.bg.base,
    boxShadow: tokens.shadow.raised.low,
    borderTop: `1px solid ${tokens.color.border.subtle}`,

    "@media": {
      "screen and (min-width: 768px)": {
        padding: `0 ${tokens.space.xl}`,
      },
    },
  },
]);

export const copyrightText = style({
  color: tokens.color.text.base,

  fontSize: tokens.font.size.xs,
  fontWeight: tokens.font.weight.medium,
  letterSpacing: "0.05em",

  opacity: 0.8,
});

export const centerSearchWrapper = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  flex: "0 1 400px",
});

export const controlsContainer = style({
  display: "flex",
  alignItems: "center",

  gap: tokens.space.md,
});
