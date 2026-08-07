// src/renderer/components/layout/navbar/navbar.css.ts
import { style } from "@vanilla-extract/css";
// 最新のエーリアス規約（@renderer/* -> src/renderer/*）に合わせてインポートパスを修正
import {
  tokens,
  themeTransition,
  brandGradientText,
  titleText,
} from "@renderer/styles/tokens";

export const container = style([
  themeTransition,
  {
    height: "80px",
    backgroundColor: tokens.color.bg.base,
    boxShadow: tokens.shadow.raised.high,
    paddingInline: tokens.space.lg,
    display: "flex",
    alignItems: "center",
    gap: tokens.space.xl,
    zIndex: tokens.zIndex.content,
  },
]);

export const logoText = style([
  brandGradientText,
  titleText,
  {
    fontSize: tokens.font.size.xl,
    whiteSpace: "nowrap",
    flexShrink: 0,
    "@media": {
      // 🎯 修正: ボタンや検索窓のスペースを確保するため、少し早めの幅でロゴを隠す
      "screen and (max-width: 850px)": {
        display: "none",
      },
    },
  },
]);

export const centerItem = style({
  // 🎯 修正: position: absolute を廃止して flexbox のフローに従わせる
  flex: 1,
  minWidth: 0,
  maxWidth: "1000px",

  display: "flex",
  alignItems: "center",
  gap: tokens.space.xl,
  justifyContent: "center",

  "@media": {
    "screen and (max-width: 1150px)": {
      maxWidth: "none",
      flex: 1,
      minWidth: 0,
      justifyContent: "flex-start",
      marginLeft: tokens.space.md,
    },
  },
});

// 🎯 修正: 2. 改修設計：navbar.tsx のコンポーネント同士が「被る」のを完全に防ぐための分割ルール
// StatusSummary（サマリーコンポーネント）側に割り当てているスタイル
export const centerSummaryWrapper = style({
  flex: 3, // 🎯 サマリーエリアを広めに確保（比率3）
  minWidth: 0, // Flexの破綻防止用
});

// SearchField（検索窓）側に直接、またはラップして割り当てているスタイル
export const centerSearchWrapper = style({
  flex: 2, // 🎯 検索窓領域を比率2で確保（ウィンドウ幅に合わせて綺麗に伸縮）
  minWidth: "180px", // 🎯 これ以上縮むと文字が崩れる限界値を設定して防衛
});

export const rightGroup = style({
  display: "flex",
  alignItems: "center",
  gap: tokens.space.md,
  marginLeft: "auto", // centerItemがstaticになった後も右端をキープさせるため
  flexShrink: 0, // 🎯 右側のボタン群が文字崩れして潰れるのを完全に防ぐ
});
