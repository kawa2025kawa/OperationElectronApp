// src/renderer/features/operation/components/operationActionMenu/operationActionMenu.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import {
  brandGradientText,
  brandGradientTextRule,
  createBeforeGlowRule,
} from "@renderer/styles/global/surfaces.css";

export const menuButton = style([
  brandGradientText,
  {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: tokens.size.controlHeight,
    width: "100%",
    borderRadius: tokens.radius.full,
    border: `1px solid ${tokens.color.border.default}`,
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    cursor: "pointer",
    backgroundColor: tokens.color.bg.base,
    boxShadow: tokens.shadow.raised.high,
    outline: "none",
    transition: `border-color ${tokens.transition.glow}, opacity ${tokens.transition.fast}`,

    "::before": createBeforeGlowRule(
      `${tokens.shadow.glow.cyan}, ${tokens.shadow.pressed.low}`,
      { borderRadius: tokens.radius.full },
    ),

    selectors: {
      "&:hover:not(:disabled)::before": {
        opacity: 1,
      },
      "&:disabled": {
        opacity: 0.35,
        cursor: "not-allowed",
        boxShadow: tokens.shadow.raised.low,
        borderColor: tokens.color.border.subtle,
      },
    },
  },
]);

export const menuDropdownPositioner = style({
  zIndex: tokens.zIndex.dropdown,
});

export const menuDropdownContent = style({
  position: "relative",
  zIndex: tokens.zIndex.base,
  display: "flex",
  flexDirection: "column",
  width: "var(--anchor-width)",
  boxSizing: "border-box",
  minHeight: "200px",
  maxHeight: "var(--available-height, 60vh)",
  overflow: "hidden",
  borderRadius: tokens.radius.lg,

  border: `1px solid ${tokens.glass.contextMenu.border}`,
  backgroundColor: tokens.glass.contextMenu.surface,
  backdropFilter: `blur(${tokens.glass.contextMenu.blur}) saturate(${tokens.glass.contextMenu.saturation})`,
  boxShadow: tokens.shadow.contextMenu,

  opacity: 1,
  transition: "opacity 180ms ease-out",

  selectors: {
    "&[data-starting-style], &[data-ending-style]": {
      opacity: 0,
    },
  },
});

export const menuDropdownScroll = style([
  {
    flex: 1,
    minHeight: 0,
    width: "100%",
    boxSizing: "border-box",
    overflowY: "auto",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gridAutoRows: "minmax(80px, auto)",
    justifyItems: "center",
    alignItems: "center",
    gap: tokens.space.xs,
    padding: tokens.space.sm,
  },
]);

export const menuItem = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "72px",
  height: "72px",
  borderRadius: "50%",
  boxSizing: "border-box",
  padding: "2px",
  border: "none",
  backgroundColor: tokens.color.text.onAccent,
  boxShadow: `${tokens.shadow.glow.white}, ${tokens.shadow.raised.low}`,
  outline: "none",
  cursor: "pointer",
  transition: `box-shadow ${tokens.transition.fast}`,

  selectors: {
    "&:hover, &[data-highlighted]": {
      backgroundColor: "transparent",
      backgroundImage: tokens.gradient.brand,
      boxShadow: tokens.shadow.glowRaised.md,
    },
  },
});

export const menuItemInner = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  borderRadius: "50%",
  boxSizing: "border-box",
  padding: tokens.space.xs,
  backgroundColor: tokens.color.bg.base,
});

export const menuItemLabel = style({
  display: "inline-block",
  fontSize: tokens.font.size.xs,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.onAccent,
  textAlign: "center",
  whiteSpace: "normal",
  wordBreak: "normal",
  overflowWrap: "normal",
  lineHeight: 1.15,

  selectors: {
    [`${menuItem}:hover &, ${menuItem}[data-highlighted] &`]:
      brandGradientTextRule,
  },
});