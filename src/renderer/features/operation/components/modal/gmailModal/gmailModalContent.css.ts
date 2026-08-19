import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

export const formContainer = style({
  display: "flex",
  flexDirection: "column",
  gap: "1.5vmin",
  width: "100%",
  height: "100%",
  minHeight: 0,
  boxSizing: "border-box",
});

export const fieldGroup = style({
  display: "flex",
  flexDirection: "column",
  gap: "0.5vmin",
});

export const label = style({
  fontSize: "clamp(12px, 1.8vmin, 14px)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
});

export const input = style({
  width: "100%",
  padding: "1vmin 1.5vmin",
  borderRadius: tokens.radius.md,
  backgroundColor: tokens.color.bg.base,
  border: `1px solid ${tokens.color.border.default}`,
  color: tokens.color.text.base,
  fontSize: "clamp(12px, 2vmin, 15px)",
  outline: "none",
  boxSizing: "border-box",
  selectors: {
    "&:focus": {
      borderColor: tokens.color.accent.base,
      boxShadow: tokens.shadow.glow.brand,
    },
  },
});

export const textarea = style([
  input,
  {
    flex: 1,
    minHeight: "180px",
    resize: "none",
    fontFamily: "inherit",
  },
]);
