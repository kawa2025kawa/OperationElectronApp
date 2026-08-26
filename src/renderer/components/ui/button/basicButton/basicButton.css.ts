// src/renderer/components/ui/button/basicButton/basicButton.css.ts

import { style } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

export const basicButton = style([
  themeTransition,
  {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1vmin 2.5vmin",
    borderRadius: tokens.radius.md,
    // ★ clamp直書きから fluid トークンへ変更（必要に応じて fluid.sm / fluid.md）
    fontSize: tokens.font.fluid.sm,
    fontWeight: tokens.font.weight.bold,
    cursor: "pointer",
    outline: "none",
    minWidth: "120px",
    boxSizing: "border-box",
    transition: tokens.transition.fast,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    border: `1px solid ${tokens.color.border.default}`,

    // ★ 影のコク出し: 浮き上がり影 + 近接の濃いドロップシャドウを合成
    boxShadow: `${tokens.shadow.raised.md}, 0 4px 10px rgba(0, 0, 0, 0.4)`,

    selectors: {
      "&:hover:not(:disabled)": {
        borderColor: tokens.color.accent.neonCyan,
        // ★ ホバー時もさらに一重濃い影を積んで立体感を強調
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.high}, 0 6px 16px rgba(0, 0, 0, 0.5)`,
        color: tokens.color.text.onAccent,
      },
      "&:active:not(:disabled)": {
        // ★ 押下時はしっかり沈み込む強いインセット影に変更
        boxShadow: `${tokens.shadow.pressed.md}, inset 0 2px 4px rgba(0, 0, 0, 0.5)`,
      },
      "&:disabled": {
        opacity: 0.35,
        cursor: "not-allowed",
        pointerEvents: "none",
        backgroundColor: tokens.color.bg.inset,
        borderColor: tokens.color.border.subtle,
        color: tokens.color.text.base,
        boxShadow: tokens.shadow.pressed.low,
        filter: "grayscale(60%)",
        textShadow: "none",
      },
    },
  },
]);

export const defaultVariant = style({});
export const primary = style({});
export const danger = style({
  borderColor: tokens.color.status?.error ?? "#f87171",
  color: tokens.color.status?.error ?? "#f87171",
});
