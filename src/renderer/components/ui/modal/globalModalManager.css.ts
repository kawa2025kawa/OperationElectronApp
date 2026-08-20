import { style } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

/* =======================================
 * 背景オーバーレイ
 * ======================================= */
export const overlay = style({
  position: "fixed",
  inset: 0,
  zIndex: tokens.zIndex.overlay,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

/* =======================================
 * モーダルコンテンツ枠組み
 * ======================================= */
export const contentWrapper = style([
  themeTransition,
  {
    position: "relative",
    zIndex: tokens.zIndex.modal,
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.raised.high,
    border: `1px solid ${tokens.color.border.default}`,
    outline: "none",
    overflow: "hidden",
    boxSizing: "border-box",

    // 💡 デフォルトサイズを CSS 側で定義
    width: "min(60vw, 700px)",
    height: "min(70vh, 600px)",
  },
]);
