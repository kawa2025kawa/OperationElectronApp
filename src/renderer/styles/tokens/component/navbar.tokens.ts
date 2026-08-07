//src\renderer\styles\tokens\component\navbar.tokens.ts

import { tokens } from "@renderer/styles/tokens";

export const navbarTokens = {
  height: "64px",
  bg: tokens.color.bg.header,
  border: `1px solid ${tokens.color.bg.inset}`,
  padding: `${tokens.space.sm} ${tokens.space.lg}`,
  zIndex: tokens.zIndex.sticky,
} as const;
