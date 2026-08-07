//src\renderer\components\layout\sidebar\sidebar.css.ts

import { style } from "@vanilla-extract/css";
import {
  tokens,
  themeTransition,
  brandGradientText,
  titleText,
} from "@renderer/styles/tokens";

/* =========================
   1. サイドバーコンテナー
========================= */
export const sidebar = style([
  themeTransition, // 各種背景色やテキストカラー、シャドウ、枠線などの切り替えをシームレスにするベース定義
  {
    position: "fixed",
    top: 0,
    left: 0,
    width: "300px",
    height: "100vh",
    backgroundColor: tokens.color.bg.base,
    zIndex: tokens.zIndex.modal,
    transform: "translateX(-100%)",

    // サイドバーの開閉、およびライト/ダークモードトグル時のボックスシャドウの追従性を高めるトランジション
    transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,

    display: "flex",
    flexDirection: "column",
    boxShadow: tokens.shadow.raised.high,
    borderRight: `1px solid ${tokens.color.border.subtle}`,
  },
]);

export const sidebarOpen = style({
  transform: "translateX(0)",
});

/* =========================
   2. ヘッダー
========================= */
export const header = style({
  padding: `${tokens.space.xl} ${tokens.space.lg}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});

export const headerTitle = style([
  brandGradientText, // ブランドグラデーションの適用
  titleText, // タイトルフォントファミリーの割当
  {
    fontSize: tokens.font.size.xl, // タイトルサイズ指定
  },
]);

/* =========================
   3. メニューリスト
========================= */
export const menuList = style({
  listStyle: "none",
  padding: 10,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.md,
});

export const menuItem = style({
  width: "100%",
});

/* =========================
   4. メニューボタン
========================= */
export const menuButton = style({
  width: "100%",
  padding: tokens.space.lg,
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.md,
  color: tokens.color.text.base,
  fontSize: tokens.font.size.md,
  fontWeight: tokens.font.weight.bold,
  border: "none",
  textAlign: "left",
  boxShadow: tokens.shadow.raised.md,
  cursor: "pointer",
  transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,

  selectors: {
    "&:hover": {
      color: tokens.color.text.hover,
      boxShadow: tokens.shadow.glow.cyan,
    },
    "&:active": {
      boxShadow: tokens.shadow.pressed.low,
    },
    "&[data-active='true']": {
      // 選択状態のアクティブな項目は、raised（浮き出し）から pressed（窪み）へ反転させて沈み込みを表現
      backgroundColor: tokens.color.bg.base,
      boxShadow: tokens.shadow.pressed.low,
    },
  },
});

// 🎯 修正: export に修正
export const menuText = style({
  transition: `filter ${tokens.transition.normal}`,

  selectors: {
    // アクティブ（data-active='true'）になった際、子要素のテキストに対してブランドカラーのグラデーションクリップをパッチ
    [`${menuButton}[data-active='true'] &`]: {
      backgroundImage: tokens.gradient.brand,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
    },
  },
});

/* =========================
   5. フッター
========================= */
export const sidebarFooter = style({
  padding: tokens.space.xl,
  borderTop: `1px solid ${tokens.color.border.subtle}`,
  marginTop: "auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});

// 🎯 修正: export に修正
export const footerLabel = style({
  fontWeight: "bold",
  color: tokens.color.text.base,
});

/* =========================
   6. テーマ切り替えトグル
========================= */
export const toggleTrack = style({
  width: "44px",
  height: "22px",
  backgroundColor: tokens.color.bg.inset,
  borderRadius: tokens.radius.full,
  position: "relative",
  cursor: "pointer",
  transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,
});

// 🎯 修正: export に修正
export const toggleThumb = style({
  width: "16px",
  height: "16px",
  borderRadius: tokens.radius.full,
  position: "absolute",
  top: "3px",
  transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,

  selectors: {
    "&[data-state='dark']": {
      right: "3px",
      backgroundColor: tokens.color.accent.neonCyan,
      boxShadow: tokens.shadow.glow.cyan,
    },
    "&[data-state='light']": {
      left: "3px",
      backgroundColor: tokens.color.text.base,
    },
  },
});
