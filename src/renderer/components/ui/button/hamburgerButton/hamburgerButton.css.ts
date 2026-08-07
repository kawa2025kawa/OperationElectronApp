// src\renderer\components\ui\button\hamburgerButton\hamburgerButton.css.ts
import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens"; // 🎯 修正: エリアスパスを他のコンポーネントと統一

// 🎯 修正: pub を export に修正
export const button = style({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-around",
  alignItems: "center",
  width: "45px",
  height: "45px",

  // 🎯 修正: トークン適用（背景色、ボーダー、角丸など）
  backgroundColor: tokens.color.bg.surface,
  border: `1px solid ${tokens.color.border.default}`,
  borderRadius: tokens.radius.full,
  cursor: "pointer",
  padding: tokens.space.sm,
  zIndex: tokens.zIndex.content,

  // 🎯 修正: テーマで定義された「低めの浮き出し立体感」を適用
  boxShadow: tokens.shadow.raised.low,

  // 🎯 修正: トランジションスピードの一元化
  transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,
  color: tokens.color.text.base,

  selectors: {
    "&:hover": {
      color: tokens.color.text.hover,
      boxShadow: tokens.shadow.glow.cyan,
    },
  },
});

// 🎯 修正: pub を export に修正
export const line = style({
  width: "20px",
  height: "2px",
  backgroundColor: "currentColor", // 親ボタン（文字色トークン）に完全追従
  borderRadius: "2px",
  transition: `background-color ${tokens.transition.fast}`,
});
