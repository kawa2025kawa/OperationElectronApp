// src/renderer/features/spreadSheet/components/modal/kokyuhyo/KokyuhyoModalContent.css.ts
import { style, styleVariants } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

export const contentContainer = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: 0,
  overflowY: "auto",
  gap: tokens.space.md,
  padding: "4px",
  boxSizing: "border-box",
});

export const button = style([
  themeTransition,
  {
    border: "none",
    cursor: "pointer",
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    fontWeight: tokens.font.weight.bold,
    outline: "none",
    boxShadow: tokens.shadow.raised.low,
    borderRadius: tokens.radius.md,
    padding: "8px 16px",
    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      },
      "&:active": {
        boxShadow: tokens.shadow.pressed.low,
      },
      '&[data-variant="pill"]': {
        padding: `${tokens.space.xs} ${tokens.space.md}`,
        color: tokens.color.accent.base,
        fontSize: tokens.font.size.sm,
        boxShadow: tokens.shadow.raised.md,
      },
    },
  },
]);

export const textGroup = style({
  display: "flex",
  gap: tokens.space.md,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
});

export const tableGrid = style([
  themeTransition,
  {
    display: "grid",
    flex: 1,
    gridTemplateColumns: "1.5fr 1fr 2.5fr 3.5fr",
    gridTemplateRows: "1fr 1.2fr 1.2fr",
    gap: tokens.space.xs,
    padding: tokens.space.sm,
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.raised.md,
    boxSizing: "border-box",
    selectors: {
      "&:hover": {
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.high}`,
      },
    },
  },
]);

const baseCell = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.space.xs,
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.sm,
    boxSizing: "border-box",
    fontSize: tokens.font.size.md,
    fontWeight: tokens.font.weight.bold,
  },
]);

export const label = style({
  fontSize: tokens.font.size.lg,
  fontWeight: tokens.font.weight.medium,
  color: tokens.color.text.base,
  opacity: 0.8,
});

export const value = style({
  fontSize: tokens.font.size.lg,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
});

export const cell = styleVariants({
  date: [
    baseCell,
    {
      gridRow: "span 3",
      flexDirection: "column",
      gap: tokens.space.xs,
      borderRadius: tokens.radius.md,
      boxShadow: tokens.shadow.pressed.md,
    },
  ],
  header: [
    baseCell,
    {
      color: tokens.color.text.hover,
      boxShadow: tokens.shadow.raised.low,
    },
  ],
  section: [
    baseCell,
    {
      color: tokens.color.accent.base,
      boxShadow: tokens.shadow.pressed.low,
    },
  ],
  data: [
    baseCell,
    {
      color: tokens.color.text.base,
      wordBreak: "break-all",
      boxShadow: tokens.shadow.pressed.low,
    },
  ],
});
