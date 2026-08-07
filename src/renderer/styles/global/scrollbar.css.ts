// src\renderer\styles\global\scrollbar.css.ts
import { globalStyle } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

globalStyle("::-webkit-scrollbar", {
  width: "6px",
  height: "6px",
});

globalStyle("::-webkit-scrollbar-track", {
  backgroundColor: "transparent",
});

globalStyle("::-webkit-scrollbar-thumb", {
  backgroundColor: tokens.color.accent.neonPink,
  borderRadius: tokens.radius.full,
});

globalStyle("::-webkit-scrollbar-thumb:hover", {
  filter: "brightness(1.2)",
});
