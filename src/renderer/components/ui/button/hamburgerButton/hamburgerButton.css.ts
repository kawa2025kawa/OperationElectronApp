// src/renderer/components/layout/navbar/components/hamburgerButton/hamburgerButton.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

// 他コンポーネントと共通の 0.8秒イージング
const smoothGlow = "0.8s cubic-bezier(0.25, 0.8, 0.25, 1)";
const t = tokens.transition.normal;

export const button = style({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-around",
  alignItems: "center",
  width: "45px",
  height: "45px",
  backgroundColor: tokens.color.bg.base,
  border: `1px solid ${tokens.color.border.default}`,
  borderRadius: tokens.radius.full,
  outline: "none",
  cursor: "pointer",
  padding: tokens.space.sm,
  zIndex: tokens.zIndex.content,
  boxShadow: tokens.shadow.raised.low,
  color: tokens.color.text.base,
  // transform は排除し、色・枠線・背景のフェードに限定
  transition: `background-color ${t}, border-color ${smoothGlow}, color ${t}, box-shadow ${t}`,

  // シアンの光（外側グロー）とインセット影を重ねるレイヤー
  "::before": {
    content: '""',
    position: "absolute",
    inset: -1,
    borderRadius: tokens.radius.full,
    boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.pressed.low}`,
    opacity: 0,
    transition: `opacity ${smoothGlow}`,
    pointerEvents: "none",
  },

  selectors: {
    // ホバー時に 0.8秒かけてふわっとシアン発光
    "&:hover::before": {
      opacity: 1,
    },
    "&:hover": {
      color: tokens.color.text.hover,
    },
  },
});

export const line = style({
  position: "relative",
  zIndex: 1,
  width: "20px",
  height: "2px",
  backgroundColor: "currentColor",
  borderRadius: "2px",
  transition: `background-color ${tokens.transition.fast}`,
});

