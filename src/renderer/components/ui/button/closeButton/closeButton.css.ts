// src/renderer/components/ui/button/closeButton/closeButton.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { neonGlowButton } from "../buttonBase.css";

export const closeButton = style([
  neonGlowButton,
  {
    width: "32px",
    height: "32px",
    borderRadius: tokens.radius.full,
    fontSize: "1.2rem",
    lineHeight: 1,
    flexShrink: 0,
  },
]);
