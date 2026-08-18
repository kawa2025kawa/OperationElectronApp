// src/renderer/components/layout/footer/components/footerActionButton.css.ts

import { style } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

export const actionButton = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "42px",
    height: "42px",
    borderRadius: tokens.radius.full,
    border: "none",
    outline: "none",
    cursor: "pointer",
    backgroundColor: tokens.color.bg.base,
    boxShadow: tokens.shadow.raised.md,
    selectors: {
      "&[data-active='false']:hover": {
        boxShadow: `${tokens.shadow.glow.brand}, ${tokens.shadow.raised.md}`,
      },
      "&[data-active='false']:active": {
        boxShadow: tokens.shadow.pressed.low,
        transform: "scale(0.96)",
      },
      "&[data-active='true']": {
        backgroundColor: tokens.color.bg.inset,
        boxShadow: `${tokens.shadow.glow.brand}, ${tokens.shadow.raised.md}`,
      },
    },
  },
]);

export const actionButtonText = style({
  fontSize: tokens.font.size.xs,
  fontWeight: tokens.font.weight.bold,
  transition: `color ${tokens.transition.normal}`,
  color: tokens.color.text.base,
  selectors: {
    [`${actionButton}[data-active='false']:hover &`]: {
      color: tokens.color.text.hover,
    },
    [`${actionButton}[data-active='true'] &`]: {
      backgroundImage: tokens.gradient.brand,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
    },
  },
});
