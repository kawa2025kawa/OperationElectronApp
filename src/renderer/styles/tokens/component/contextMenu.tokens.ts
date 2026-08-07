//src\renderer\styles\tokens\component\contextMenu.tokens.ts
import { tokens } from "@renderer/styles/tokens";

export const contextMenuTokens = {
  bg: tokens.color.bg.base,
  border: `1px solid ${tokens.color.bg.inset}`,
  shadow: tokens.shadow.raised.high,
  radius: tokens.radius.md,
  zIndex: tokens.zIndex.dropdown,
  item: {
    padding: `${tokens.space.sm} ${tokens.space.md}`,
    hoverBg: tokens.color.bg.inset,
    text: tokens.color.text.base,
  },
} as const;
