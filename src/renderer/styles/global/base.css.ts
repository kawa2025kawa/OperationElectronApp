// src\renderer\styles\global\base.css.ts
import { globalStyle } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

globalStyle("html, body", {
  fontFamily: tokens.font.base,
  backgroundColor: tokens.color.bg.base,
  color: tokens.color.text.base,
  lineHeight: 1.5,
  overflowWrap: "break-word",
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
  transition: `background-color ${tokens.transition.normal}, color ${tokens.transition.normal}`,
});
