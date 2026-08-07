//src\renderer\features\auth\authView.css.ts
import { style, globalStyle } from "@vanilla-extract/css";
import { tokens, titleText, themeTransition } from "@renderer/styles/tokens";

export const container = style({
  minHeight: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
});

/**
 * 🎯 ログイン用のカードコンテナ。
 * 横幅をデバイス幅に応じてレスポンシブにしつつ、ライト/ダークモード切り替え時にも
 * 影（boxShadow）や背景色が破綻なくスムーズにトランジションするよう設計。
 */
export const authCard = style([
  themeTransition,
  {
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.raised.high,
    width: "min(92vw, 480px)",
    padding: "clamp(1.8rem, 3vw, 2.6rem)", // 画面サイズに合わせてパディングを動的最適化
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
]);

// 🎯 修正: pub を export に修正
export const logo = style({
  fontSize: "clamp(2.8rem, 6vw, 4rem)",
  fontWeight: 900,
  lineHeight: 1,
  textAlign: "center",
});

/* Googleロゴを再現するためのカラー定義 */
export const googleBlue = style({ color: "#4285F4" });
export const googleRed = style({ color: "#EA4335" });
export const googleYellow = style({ color: "#FBBC05" });
export const googleGreen = style({ color: "#34A853" });

export const title = style([
  titleText,
  {
    margin: 0,
    fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
    textTransform: "uppercase",
    color: tokens.color.text.base,
    textAlign: "center",
  },
]);

export const status = style([
  themeTransition,
  {
    color: tokens.color.text.base,
    backgroundColor: tokens.color.bg.base,
    boxShadow: tokens.shadow.pressed.low,
    width: "100%",
    textAlign: "center",
    padding: "0.75rem 1.25rem",
    fontSize: "clamp(0.95rem, 2vw, 1.2rem)",
    fontWeight: 900,
    borderRadius: tokens.radius.md,
  },
]);

globalStyle(`${status} strong`, {
  color: tokens.color.accent.base,
});

// 🎯 修正: pub を export に修正
export const buttonWrapper = style({
  width: "100%",
  marginTop: "0.5rem",
});

/** * ログイン/ログアウトを制御するメインのアクションボタン。
 * ボタン単体のトランジションとトークン一元化されたスピード設定を合成。
 */
export const authButton = style([
  themeTransition,
  {
    appearance: "none",
    border: "none",
    cursor: "pointer",
    userSelect: "none",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "3rem",
    padding: `0 ${tokens.space.lg}`,
    fontSize: tokens.font.size.lg,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.accent.base,
    color: tokens.color.text.onAccent,
    fontWeight: tokens.font.weight.bold,
    boxShadow: tokens.shadow.raised.low,
    transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,
    selectors: {
      "&:hover:not(:disabled)": {
        backgroundColor: tokens.color.accent.hover,
        transform: "translateY(-1px)",
        boxShadow: tokens.shadow.raised.md,
      },
      "&:active:not(:disabled)": {
        transform: "translateY(0)",
        boxShadow: tokens.shadow.pressed.md,
      },
      "&:disabled": {
        opacity: 0.5,
        cursor: "not-allowed",
      },
    },
  },
]);
