// src\renderer\styles\global\reset.css.ts
import { globalStyle } from "@vanilla-extract/css";

// 全要素のボックスモデル定義のリセット (border-box 化)
globalStyle("*, *::before, *::after", {
  boxSizing: "border-box",
  margin: 0,
  padding: 0,
});

// HTMLおよびBODY要素のベーススタイルリセット、外枠スクロール禁止、フォントスムージング適用
globalStyle("html, body", {
  height: "100%",
  width: "100%",
  overflow: "hidden",
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
});

// リスト要素のブラウザ標準マーカーを解除
globalStyle("ul, ol", {
  listStyle: "none",
});

// リンク要素の標準下線および文字色装飾をリセット
globalStyle("a", {
  textDecoration: "none",
  color: "inherit",
});

// ボタン、インプット等のフォーム関連要素のネイティブ外観・枠線をクリーンアップ
globalStyle("button, input, select, textarea", {
  fontFamily: "inherit",
  fontSize: "inherit",
  color: "inherit",
  background: "transparent",
  border: "none",
  outline: "none",
});

// ボタン要素のポインターカーソル化を全適用
globalStyle("button", {
  cursor: "pointer",
});

// 画像およびメディア要素のブロック化とバースト防止ガード
globalStyle("img, svg, video, canvas", {
  display: "block",
  maxWidth: "100%",
});
