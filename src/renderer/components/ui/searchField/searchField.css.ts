// src\renderer\components\ui\searchField\searchField.css.ts
import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";
import { searchFieldTokens } from "@renderer/styles/tokens/component/searchField.tokens";

export const inner = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  width: "100%",
  maxWidth: searchFieldTokens.maxWidth, // デフォルト値 300px

  // ウィンドウ幅に応じたレスポンシブガード
  "@media": {
    "screen and (max-width: 900px)": {
      maxWidth: "240px", // 画面が狭いときは検索窓を少し縮めてNavbar内の他の要素を生かす
    },
    "screen and (max-width: 600px)": {
      maxWidth: "160px", // スマホサイズではさらに縮小
    },
  },
});

export const searchField = style({
  width: "100%",
  border: "none",
  outline: "none",
  padding: `${tokens.space.sm} ${tokens.space.lg}`, // 🎯 修正: 左右幅(上下非対称)のシンプルなパディングへと修正
  borderRadius: searchFieldTokens.radius,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.raised.low,
  color: tokens.color.text.base,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,

  // モバイル用にフォントサイズを微調整
  "@media": {
    "screen and (max-width: 600px)": {
      fontSize: "0.8rem",
    },
  },

  selectors: {
    "&:hover": {
      boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      color: tokens.color.text.hover,
    },
    "&:focus": {
      boxShadow: `${tokens.shadow.glow.brand}, ${tokens.shadow.raised.md}`,
      transform: "translateY(-1px)",
    },
    "&:active": {
      boxShadow: tokens.shadow.pressed.low,
      transform: "scale(0.98) translateY(0)",
    },
    "&::-webkit-search-cancel-button": {
      cursor: "pointer",
    },
  },
});
