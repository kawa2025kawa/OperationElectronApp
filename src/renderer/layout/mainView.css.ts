// src/renderer/layout/AppLayout.css.ts
import { style, styleVariants } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

/**
 * 1. アプリ全体の最外殻（ウィンドウ全体）
 * themeTransition を合成し、画面の縦横を固定して画面外スクロールを完全防止します。
 */
export const appContainer = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    height: "100vh", // 画面の縦高さいっぱいに固定
    width: "100vw", // 画面の横幅いっぱいに固定
    backgroundColor: tokens.color.bg.base,
    overflow: "hidden", // アプリ全体の不要なスクロールを完全に禁止
  },
]);

/**
 * 2. ナビゲーションバーの下、メイン領域（サイドバー ＋ コンテンツ）が入る器
 * ナビゲーションバーの高さ（例: 80px）を引いた、残りの画面高さいっぱいに割り当てられます。
 */
export const contentWrapper = style({
  display: "flex",
  flex: 1, // ナビゲーションバー以外の残りの高さを全取り
  width: "100%",
  minHeight: 0, // Flexboxの高さ潰れによるスクロール破綻を防ぐための最重要プロパティ
  position: "relative",
});

/**
 * 3. サイドバーの表示・非表示切り替え用スタイル（recipe を廃止）
 */
export const sidebarBase = style({
  height: "100%",
  transition: `width ${tokens.transition.normal}`,
  flexShrink: 0,
});

export const sidebarCollapsed = styleVariants({
  true: { width: "0px" },
  false: { width: "260px" },
});

/**
 * 4. 右側のメインコンテンツ本体
 * contentWrapper の高さを 100% 引き継ぎ、内部を縦の FlexBox とします。
 */
export const mainContent = style({
  flex: 1,
  height: "100%", // 親の「残りの高さ」を100%継承
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
});

/**
 * 5. MainView 内のラッパー（アニメーションコンポーネントの親拡大用）
 */
export const mainContentWrapper = style({
  display: "flex",
  flexDirection: "column",
  height: "100%", // 高さを途切れさせないよう100%継承
  width: "100%",
  position: "relative",
});

// ビューコンポーネント配置用ラッパー
export const viewWrapper = style({
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
});

/**
 * 6. アニメーション用の共通ラッパー
 */
export const animatedContent = style({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  height: "100%",
  width: "100%",
  minHeight: 0,
});

/**
 * 7. 各画面（OperationView や SpreadSheetView）の器
 * これが「フッター以外の余った領域」をすべて抱え込んで膨らむため、
 * フッターが必要な画面では一番下に押し下げられます。
 */
export const viewContainer = style({
  flex: 1, // これ自身が役割として余白をすべて引き受け、フッターを底に落とす
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  position: "relative",
});
