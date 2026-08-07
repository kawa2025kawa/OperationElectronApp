// src\renderer\components\ui\emptyState\emptyState.css.ts
import { style } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

export const emptyWrapper = style({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  height: "100%", // 🎯 親の枠の高さいっぱいに広げる
  minHeight: 0, // 🎯 px固定をやめ、Flex子要素として縮小可能にする
  flex: 1,
  overflow: "hidden", // 🎯 枠外へのはみ出しを確実にカット
});

export const emptyText = style([
  themeTransition,
  {
    // 🎯 clampの最小・最大・推奨値を画面/親枠の比率（vmin / cqw）に変更
    fontSize: "clamp(1.5rem, 5vmin, 3.5rem)",
    fontWeight: tokens.font.weight.bold,
    opacity: 0.1,
    color: tokens.color.text.base,
    transform: "rotate(-6deg)",
    whiteSpace: "nowrap",
    userSelect: "none",
  },
]);
