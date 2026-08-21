import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

/* =======================================
 * ベースコンテナ (中央揃えレイアウト)
 * ======================================= */
export const stateContainer = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "3vmin",
  gap: "1.5vmin",
  textAlign: "center",
  width: "100%",
  boxSizing: "border-box",
});

/* =======================================
 * 成功／エラー アイコン領域
 * ======================================= */
export const successIcon = style({
  fontSize: "3.5rem",
  color: tokens.color.status.success,
  lineHeight: 1,
  marginBottom: "0.5vmin",
});

export const errorIcon = style({
  fontSize: "3.5rem",
  color: tokens.color.status.error,
  lineHeight: 1,
  marginBottom: "0.5vmin",
});

/* =======================================
 * エラーメッセージ用テキスト
 * ======================================= */
export const errorText = style({
  color: tokens.color.status.error,
  wordBreak: "break-word",
  fontSize: tokens.font.size.sm,
  lineHeight: 1.5,
});

/* =======================================
 * ボタンエリア ＆ アクションボタン
 * ======================================= */
export const buttonGroup = style({
  display: "flex",
  gap: "1.5vmin",
  marginTop: "2vmin",
  justifyContent: "center",
  width: "100%",
});

export const primaryButton = style({
  padding: "1.2vmin 3.5vmin",
  borderRadius: tokens.radius.md,
  border: "none",
  backgroundColor: tokens.color.accent.base,
  color: tokens.color.text.onAccent,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  cursor: "pointer",
  boxShadow: tokens.shadow.raised.low,
  transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,

  selectors: {
    "&:hover": {
      opacity: 0.9,
      boxShadow: tokens.shadow.glow.brand,
    },
    "&:active": {
      transform: "scale(0.98)",
    },
  },
});
