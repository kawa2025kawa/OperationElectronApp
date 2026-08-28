import { style, globalStyle } from "@vanilla-extract/css";
import { tokens, titleText, themeTransition } from "@renderer/styles/tokens";

export const container = style({
  minHeight: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "2rem",
});

/**
 * ログイン用カード
 */
export const authCard = style([
  themeTransition,
  {
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.raised.high,
    width: "min(92vw, 480px)",
    padding: "clamp(1.8rem, 3vw, 2.6rem)",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
]);

/**
 * Google ロゴ
 */
export const logo = style({
  fontSize: "clamp(2.8rem, 6vw, 4rem)",
  fontWeight: 900,
  lineHeight: 1,
  textAlign: "center",
});

/* Googleロゴを再現するためのカラー定義 */
export const googleBlue = style({
  color: "#4285F4",
});

export const googleRed = style({
  color: "#EA4335",
});

export const googleYellow = style({
  color: "#FBBC05",
});

export const googleGreen = style({
  color: "#34A853",
});

/**
 * カードタイトル
 */
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

/**
 * ログイン状態
 */
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

/**
 * Googleアカウント情報セクション
 */
export const accountSection = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    width: "100%",
    paddingTop: "0.25rem",
  },
]);

/**
 * Googleアカウント情報の見出し
 */
export const accountTitle = style([
  titleText,
  {
    margin: 0,
    fontSize: tokens.font.size.md,
    color: tokens.color.text.base,
  },
]);

/**
 * アカウント情報の1行
 */
export const accountInfoRow = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    width: "100%",
    padding: "0.7rem 1rem",
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.bg.base,
    boxShadow: tokens.shadow.pressed.low,
  },
]);

/**
 * アカウント情報のラベル
 */
export const accountInfoLabel = style({
  flexShrink: 0,
  color: tokens.color.text.base,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
});

/**
 * アカウント情報の値
 */
export const accountInfoValue = style({
  minWidth: 0,
  color: tokens.color.text.base,
  fontSize: tokens.font.size.md,
  fontWeight: tokens.font.weight.bold,
  textAlign: "right",
  overflowWrap: "anywhere",
});

/**
 * 未ログイン時の値
 */
export const accountInfoEmpty = style({
  color: tokens.color.text.base,
  fontWeight: tokens.font.weight.normal,
});

/**
 * ログイン/ログアウトボタン
 */
export const buttonWrapper = style({
  width: "100%",
  marginTop: "0.5rem",
});

/**
 * ログイン/ログアウトを制御するメインのアクションボタン
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
        boxShadow: tokens.shadow.raised.md,
      },
      "&:active:not(:disabled)": {
        boxShadow: tokens.shadow.pressed.md,
      },
      "&:disabled": {
        opacity: 0.5,
        cursor: "not-allowed",
      },
    },
  },
]);
