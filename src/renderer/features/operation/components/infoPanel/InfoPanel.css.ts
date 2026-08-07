// src/renderer/features/operation/components/infoPanel/InfoPanel.css.ts
import { style, styleVariants } from "@vanilla-extract/css";
import { tokens, truncateText, themeTransition } from "@renderer/styles/tokens";

export const infoContainer = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
    height: "100%",
    overflow: "hidden",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.raised.high,
  },
]);

export const infolsList = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: tokens.space.md,
    gap: tokens.space.md,
  },
]);

export const row = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
    paddingInline: tokens.space.lg,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    boxShadow: tokens.shadow.raised.low,
    cursor: "default",
    transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,
    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.low}`,
      },
    },
  },
]);

export const rowVariants = styleVariants({
  standard: {
    height: "3.5rem",
  },
  remarks: {
    minHeight: "4.5rem",
    paddingBlock: tokens.space.md,
    alignItems: "flex-start",
  },
});

export const infoLabel = style({
  flexShrink: 0,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  whiteSpace: "nowrap",
});

export const resultvalue = style({
  flex: 1,
  paddingLeft: tokens.space.md,
  color: "inherit",
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  textAlign: "right",
});

export const detailValueVariants = styleVariants({
  standard: [truncateText],
  remarks: {
    whiteSpace: "normal",
    wordBreak: "break-all",
    lineHeight: 1.6,
  },
});

export const cellBadge = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    paddingInline: tokens.space.md,
    marginBottom: tokens.space.sm,
    border: "2px solid currentcolor",
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    fontSize: tokens.font.size.md,
    fontWeight: tokens.font.weight.bold,
    whiteSpace: "nowrap",
    boxShadow: tokens.shadow.raised.low,
    cursor: "context-menu",
    transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,
    selectors: {
      "&:hover": {
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
        filter: "brightness(1.1)",
      },
    },
  },
]);
