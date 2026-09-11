// src/renderer/components/ui/auth/authCard.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

/* ============================================================
 * Flexible Card Container (上下の余白バランス最適化)
 * ============================================================ */

export const container = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-between", // 🎯 上下に要素を均等に分散配置
  width: "100%",
  maxWidth: "600px",
  height: "90%", // 🎯 親領域をいっぱいに使う
  maxHeight: "90%",
  padding: "clamp(24px, 6cqh, 40px) clamp(20px, 4cqw, 32px)", // 🎯 上下の内側余白を拡張
  borderRadius: tokens.radius.lg,
  backgroundColor: tokens.color.bg.base,
  border: `1px solid ${tokens.color.border.default}`,
  boxShadow: tokens.shadow.raised.high,
  boxSizing: "border-box",
  overflow: "hidden",
  gap: "clamp(12px, 3cqh, 24px)",
});

/* ============================================================
 * Dynamic Content Elements
 * ============================================================ */

export const logo = style({
  fontSize: "clamp(2.2rem, 8cqh, 3.5rem)", // 🎯 ロゴサイズを高さに連動して大きく
  fontWeight: tokens.font.weight.bold,
  letterSpacing: "-0.05em",
  lineHeight: 1,
  margin: 0,
});

export const googleBlue = style({ color: "#4285F4" });
export const googleRed = style({ color: "#EA4335" });
export const googleYellow = style({ color: "#FBBC05" });
export const googleGreen = style({ color: "#34A853" });

export const title = style({
  fontSize: "clamp(1.1rem, 3.5cqh, 1.5rem)",
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  margin: 0,
});

/* ------------------------------------------------------------
 * Status (凸 + 動的枠線/発光)
 * ------------------------------------------------------------ */
export const status = style({
  fontSize: "clamp(0.85rem, 3cqh, 1rem)",
  color: tokens.color.text.base,
  opacity: 0.9,
  margin: 0,
  padding: "clamp(6px, 1.2cqh, 10px) clamp(16px, 3cqw, 24px)",
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.raised.low,
  transition: tokens.transition.normal,
});

/* 未ログイン: ネオンピンク枠線 */
export const statusLoggedOut = style({
  border: `1px solid ${tokens.color.accent.neonPink}`,
  boxShadow: `${tokens.shadow.raised.low}, 0 0 8px ${tokens.color.accent.neonPink}`,
});

/* ログイン済み: ネオングリーン枠線 */
export const statusLoggedIn = style({
  border: `1px solid ${tokens.color.status.success}`,
  boxShadow: `${tokens.shadow.raised.low}, 0 0 8px ${tokens.color.status.success}`,
});

/* ステータステキスト */
export const statusText = style({
  fontWeight: tokens.font.weight.bold,
  transition: tokens.transition.normal,
});

export const statusTextLoggedOut = style({
  color: tokens.color.accent.neonPink,
});

export const statusTextLoggedIn = style({
  color: tokens.color.status.success,
});

/* ------------------------------------------------------------
 * Account Section
 * ------------------------------------------------------------ */
export const accountSection = style({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "clamp(10px, 2cqh, 16px)",
  margin: 0,
});

/* 凹 (Pressed) 情報行 */
export const accountInfoRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "clamp(12px, 2.5cqh, 18px) clamp(16px, 3cqw, 24px)", // 🎯 行の縦幅をしっかり確保
  borderRadius: tokens.radius.md,
  backgroundColor: tokens.color.bg.base,
  border: `1px solid ${tokens.color.border.subtle}`,
  fontSize: "clamp(0.85rem, 2.8cqh, 1rem)",
  boxShadow: tokens.shadow.pressed.low,
});

export const accountInfoLabel = style({
  color: tokens.color.text.base,
  opacity: 0.7,
  fontWeight: tokens.font.weight.medium,
});

export const accountInfoValue = style({
  color: tokens.color.text.base,
  fontWeight: tokens.font.weight.bold,
});

export const accountInfoEmpty = style({
  color: tokens.color.text.base,
  opacity: 0.4,
  fontStyle: "italic",
});

/* ------------------------------------------------------------
 * Button Wrapper & Action Button
 * ------------------------------------------------------------ */
export const buttonWrapper = style({
  width: "100%",
  marginTop: "auto", // 🎯 下部に心地よい空間を残して接地させる
});

export const authButton = style({
  width: "100%",
  height: "clamp(42px, 7cqh, 54px)", // 🎯 ボタン自体の高さもカードサイズに追従
  borderRadius: tokens.radius.md,
  border: "none",
  backgroundColor: tokens.color.accent.base,
  color: tokens.color.text.onAccent,
  fontSize: "clamp(0.9rem, 3cqh, 1.1rem)",
  fontWeight: tokens.font.weight.bold,
  cursor: "pointer",
  boxShadow: tokens.shadow.raised.low,
  transition: `background-color ${tokens.transition.fast}, transform ${tokens.transition.fast}, box-shadow ${tokens.transition.fast}`,
  selectors: {
    "&:hover:not(:disabled)": {
      backgroundColor: tokens.color.accent.hover,
      boxShadow: tokens.shadow.raised.md,
    },
    "&:active:not(:disabled)": {
      transform: "scale(0.98)",
      boxShadow: tokens.shadow.pressed.low,
    },
    "&:disabled": {
      opacity: 0.6,
      cursor: "not-allowed",
      boxShadow: "none",
    },
  },
});
