// src/renderer/features/other/components/modal/contents/gmailDraft/gmailDraftContent.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

const t = tokens.transition.normal;

export const formContainer = style({
  display: "flex",
  flex: 1,
  flexDirection: "column",
  gap: tokens.space.md,
  width: "100%",
  minHeight: 0,
  boxSizing: "border-box",
  overflowY: "auto",
  paddingRight: tokens.space.xs,
  isolation: "isolate",
});

export const fieldGroup = style({
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.xs,
  flexShrink: 0,
});

export const bodyFieldGroup = style([
  fieldGroup,
  {
    flex: 1,
    minHeight: "180px",
  },
]);

export const label = style({
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
});

export const input = style({
  width: "100%",
  padding: `${tokens.space.sm} ${tokens.space.md}`,
  borderRadius: tokens.radius.md,
  backgroundColor: tokens.color.bg.base,
  border: `1px solid ${tokens.color.border.subtle}`,
  color: tokens.color.text.base,
  fontSize: tokens.font.size.sm,
  outline: "none",
  boxSizing: "border-box",
  boxShadow: tokens.shadow.pressed.low,
  transition: `border-color ${t}, box-shadow ${t}`,

  selectors: {
    "&:focus": {
      borderColor: tokens.color.accent.base,
      boxShadow: `${tokens.shadow.pressed.low}, ${tokens.shadow.glow.brand}`,
    },
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.7,
    },
  },
});

export const selectInput = style([
  input,
  {
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: "32px",
    cursor: "pointer",
    textAlign: "left",
    backgroundColor: tokens.color.bg.base,
    border: `1px solid ${tokens.color.border.default}`,
    boxShadow: tokens.shadow.raised.low,

    backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8"><path fill="%2300C8B4" d="M0 0l6 7 6-7z"/></svg>')`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "12px 8px",

    selectors: {
      "&:hover:not(:disabled)": {
        borderColor: tokens.color.accent.base,
        boxShadow: `${tokens.shadow.raised.low}, ${tokens.shadow.glow.brand}`,
      },
      "&:focus-visible": {
        outline: `2px solid ${tokens.color.accent.base}`,
        outlineOffset: "2px",
        borderColor: tokens.color.accent.base,
        boxShadow: `${tokens.shadow.raised.low}, ${tokens.shadow.glow.brand}`,
      },
      "&:disabled": {
        cursor: "not-allowed",
        opacity: 0.7,
      },
    },
  },
]);

export const selectPositioner = style({
  width: "var(--anchor-width)",
  zIndex: `calc(${tokens.zIndex.modal} + 10)`,
});

export const selectPopup = style({
  width: "100%",
  maxHeight: "var(--available-height, 50vh)",
  overflowY: "auto",
  padding: tokens.space.xs,
  borderRadius: tokens.radius.md,
  backgroundColor: tokens.color.bg.base,
  border: `1px solid ${tokens.color.border.default}`,
  boxShadow: tokens.shadow.raised.high,
  outline: "none",
});

export const selectList = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
});

export const selectItem = style({
  display: "flex",
  alignItems: "center",
  width: "100%",
  minHeight: "36px",
  padding: `${tokens.space.sm} ${tokens.space.md}`,
  border: "none",
  borderRadius: tokens.radius.sm,
  backgroundColor: "transparent",
  color: tokens.color.text.base,
  fontSize: tokens.font.size.sm,
  textAlign: "left",
  cursor: "pointer",
  outline: "none",
  transition: `background-color ${t}, color ${t}`,

  selectors: {
    "&[data-highlighted]": {
      backgroundColor: tokens.color.bg.frostedGlass,
      color: tokens.color.accent.base,
    },
    "&[data-selected]": {
      color: tokens.color.accent.base,
      fontWeight: tokens.font.weight.bold,
    },
    "&[data-disabled]": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
});

const baseTextarea = style([
  input,
  {
    resize: "none",
    fontFamily: tokens.font.base,
    lineHeight: 1.5,
  },
]);

export const addressTextarea = style([
  baseTextarea,
  {
    minHeight: "42px",
    maxHeight: "80px",
  },
]);

export const bodyTextarea = style([
  baseTextarea,
  {
    height: "100%",
    minHeight: "150px",
  },
]);
