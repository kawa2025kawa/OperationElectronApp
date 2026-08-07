//src\renderer\styles\tokens\component\searchField.tokens.ts

import { tokens } from "@renderer/styles/tokens";

export const searchFieldTokens = {
  maxWidth: "300px",
  bg: tokens.color.bg.inset,
  radius: tokens.radius.full,
  shadow: tokens.shadow.pressed.low,
  focusShadow: tokens.shadow.pressed.md,
  accent: tokens.color.accent.base,
} as const;
