// src/renderer/components/ui/tooltip/tooltip.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

export const positioner = style({
  zIndex: tokens.zIndex.tooltip,
  pointerEvents: "none",
});

export const popup = style({
  maxWidth: "360px",
  padding: `${tokens.space.xs} ${tokens.space.sm}`,
  borderRadius: tokens.radius.sm,
  border: `1px solid ${tokens.glass.contextMenu.border}`,
  backgroundColor: tokens.glass.contextMenu.surface,
  backdropFilter: `blur(${tokens.glass.contextMenu.blur}) saturate(${tokens.glass.contextMenu.saturation})`,
  boxShadow: tokens.shadow.contextMenu,
  color: tokens.color.text.hover,
  fontFamily: tokens.font.base,
  fontSize: tokens.font.size.xs,
  fontWeight: tokens.font.weight.medium,
  lineHeight: 1.4,
  wordBreak: "break-all",
  opacity: 1,
  transform: "scale(1)",
  transition: `opacity ${tokens.transition.fast}, transform ${tokens.transition.fast}`,

  selectors: {
    "&[data-starting-style], &[data-ending-style]": {
      opacity: 0,
      transform: "scale(0.96)",
    },
  },
});
