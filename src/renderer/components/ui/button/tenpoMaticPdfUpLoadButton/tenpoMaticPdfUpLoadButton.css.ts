// src/renderer/components/ui/button/tenpoMaticPdfUpLoadButton/tenpoMaticPdfUpLoadButton.css.ts

import { createVar, style } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

const btnBgColor = createVar();
const btnTextColor = createVar();
const btnShadow = createVar();
const btnBorderColor = createVar();

export const container = style([
  themeTransition,
  {
    vars: {
      [btnBgColor]: tokens.color.bg.base,
      [btnTextColor]: tokens.color.text.base,
      [btnShadow]: tokens.shadow.raised.low,
      [btnBorderColor]: tokens.color.border.subtle,
    },
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.space.xs,
    padding: `${tokens.space.xs} ${tokens.space.lg}`,
    height: "32px",
    borderRadius: tokens.radius.full,
    backgroundColor: btnBgColor,
    color: btnTextColor,
    boxShadow: btnShadow,
    border: `1px solid ${btnBorderColor}`,
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    cursor: "pointer",
    outline: "none",
    userSelect: "none",
    transition: "all 0.25s ease-out",

    selectors: {
      "&:hover": {
        vars: {
          [btnTextColor]: tokens.color.text.hover,
          [btnShadow]: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
          [btnBorderColor]: tokens.color.accent.neonCyan,
        },
        transform: "translateY(-1px)",
      },
      "&:active": {
        vars: {
          [btnShadow]: tokens.shadow.pressed.low,
        },
        transform: "translateY(0)",
      },
      "&:disabled": {
        opacity: 0.5,
        cursor: "not-allowed",
        transform: "none",
        boxShadow: tokens.shadow.raised.low,
      },
    },
  },
]);

export const icon = style({
  width: "14px",
  height: "14px",
  flexShrink: 0,
  fill: "currentColor",
  transition: "transform 0.25s ease",

  selectors: {
    [`${container}:hover &`]: {
      transform: "scale(1.1)",
    },
  },
});

export const label = style({
  pointerEvents: "none",
  whiteSpace: "nowrap",
});
