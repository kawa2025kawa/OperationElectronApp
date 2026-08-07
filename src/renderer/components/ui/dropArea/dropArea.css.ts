import { style } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

export const dropContainer = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: "150px",
    padding: tokens.space.lg,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.bg.base,
    border: `2px dashed ${tokens.color.border.default}`,
    boxShadow: tokens.shadow.pressed.low,
    cursor: "pointer",
    boxSizing: "border-box",
    outline: "none",

    selectors: {
      "&:hover": {
        borderColor: tokens.color.accent.neonCyan,
        boxShadow: tokens.shadow.glow.cyan,
      },
      /* 🎯 ドラッグ時の強力なネオン発光 (テーマのネオンシアン＆グローシャドウを使用) */
      "&[data-dragging='true']": {
        borderColor: tokens.color.accent.neonCyan,
        backgroundColor: tokens.color.bg.inset,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.pressed.md}`,
        transform: "scale(1.01)",
      },
    },
  },
]);

export const iconText = style({
  fontSize: "2.5rem",
  marginBottom: tokens.space.sm,
});

export const placeholderText = style({
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  textAlign: "center",
});

/* 🎯 選択中ファイルエリアのコンテナ（縦スクロール化＆ニューモフィズム凹み適用） */
export const fileSection = style({
  width: "100%",
  marginTop: tokens.space.lg,
  cursor: "default",
});

export const fileCountTitle = style({
  fontSize: tokens.font.size.xs,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  marginBottom: tokens.space.xs,
});

export const fileListContainer = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    gap: tokens.space.xs,
    width: "100%",
    maxHeight: "130px", // 🎯 縦スクロール限界値
    overflowY: "auto",
    padding: tokens.space.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.bg.inset,
    border: `1px solid ${tokens.color.border.default}`,
    boxShadow: tokens.shadow.pressed.low, // インセット（凹み）ニューモフィズム
    boxSizing: "border-box",

    /* スクロールバーのトークン対応 */
    selectors: {
      "&::-webkit-scrollbar": {
        width: "6px",
      },
      "&::-webkit-scrollbar-thumb": {
        backgroundColor: tokens.color.border.default,
        borderRadius: tokens.radius.full,
      },
    },
  },
]);

export const fileCard = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    padding: `${tokens.space.xs} ${tokens.space.sm}`,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.bg.surface,
    border: `1px solid ${tokens.color.border.subtle}`,
    boxShadow: tokens.shadow.raised.low, // カード自体の立体感
  },
]);

export const fileName = style({
  fontSize: tokens.font.size.xs,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.hover, // 🎯 明るく見やすい文字色
  wordBreak: "break-all",
});

export const filePath = style({
  fontSize: "0.7rem",
  color: tokens.color.text.base,
  marginTop: "2px",
  wordBreak: "break-all",
});
