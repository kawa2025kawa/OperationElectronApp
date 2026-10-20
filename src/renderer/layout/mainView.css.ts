// src/renderer/layout/mainView.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

/**
 * 1. アプリ全体の最外殻（ウィンドウ全体）
 * themeTransition を合成し、画面の縦横を固定して画面外スクロールを完全防止します。
 */
export const appContainer = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100vw",
    backgroundColor: tokens.color.bg.base,
    overflow: "hidden",

    // 最外殻のレイヤー隔離
    position: "relative",
    isolation: "isolate",
  },
]);

/**
 * 2. ナビゲーションバーの下、メイン領域（サイドバー ＋ コンテンツ）が入る器
 */
export const contentWrapper = style({
  display: "flex",
  flex: 1,
  width: "100%",
  minHeight: 0,
  position: "relative",
  isolation: "isolate",
});

/**
 * 3. サイドバーの表示・非表示切り替え用スタイル
 */
export const sidebarBase = style({
  height: "100%",
  transition: `width ${tokens.transition.normal}`,
  flexShrink: 0,
  position: "relative",
  zIndex: 20,
  isolation: "isolate",
  transform: "translateZ(0)",
});

export const sidebarCollapsed = styleVariants({
  true: { width: "0px" },
  false: { width: "260px" },
});

/**
 * 4. 右側のメインコンテンツ本体
 */
export const mainContent = style({
  flex: 1,
  height: "100%",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  position: "relative",
  zIndex: 10,
  isolation: "isolate",
  transform: "translateZ(0)",
});

/**
 * 5. ビューコンポーネント配置用ラッパー
 * VIEW 切り替え時のアニメーションや DOM 差し替えによるペイントをこの領域内だけに完全閉塞します。
 */
export const viewWrapper = style({
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  position: "relative",
  isolation: "isolate",
  transform: "translateZ(0)",
  overflow: "hidden",
});
