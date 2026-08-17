import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

/** 🎯 通知パネル全体のコンテナ（画面右上の固定枠） */
export const notificationPanelWrapper = style({
  position: "fixed",
  top: "110px",
  bottom: "100px",
  right: "25px",
  width: "min(28vw, 520px)",
  maxHeight: "75vh",

  display: "flex",
  flexDirection: "column",
  gap: "1.5vmin",

  zIndex: tokens.zIndex.toast,
  padding: "2vmin",
  borderRadius: tokens.radius.lg,

  backgroundColor: "rgba(18, 18, 20, 0.65)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",

  border: "1px solid rgba(255, 255, 255, 0.1)",
  boxShadow: tokens.shadow.raised.high,

  overflowY: "auto",
  scrollbarWidth: "none",

  selectors: {
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
});

/** 🎯 パネルヘッダー配置枠 */
export const headerWrapper = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingInline: "0.5vmin",
  flexShrink: 0,
});

/** 🎯 パネルヘッダータイトル */
export const panelHeader = style({
  fontSize: "clamp(11px, 1.8vmin, 14px)",
  fontWeight: 700,
  letterSpacing: "0.08em",
  opacity: 0.7,
  textTransform: "uppercase",
  color: tokens.color.text.onAccent,
});

/** 🎯 トーストカード一覧のラッパー */
export const toastList = style({
  display: "flex",
  flexDirection: "column",
  gap: "1.2vmin",
  minHeight: 0,
});

/** 🎯 個別トーストカードのベーススタイル */
export const toastBase = style({
  position: "relative",
  padding: "1.2vmin 1.6vmin",
  borderRadius: tokens.radius.md,

  display: "flex",
  alignItems: "center",
  gap: "1.2vmin",

  fontSize: "clamp(12px, 1.8vmin, 14px)",
  fontWeight: 600,
  lineHeight: 1.4,

  flexShrink: 0,
  overflow: "hidden",

  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.raised.md,
  border: `1px solid ${tokens.color.border.subtle}`,
  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",

  selectors: {
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: tokens.shadow.raised.high,
      borderColor: tokens.color.border.accent,
    },
  },
});

/** 🎯 ステータスアイコン枠 */
export const toastIcon = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: "2vmin",
  height: "2vmin",
  minWidth: "18px",
  minHeight: "18px",
  fontSize: "1.1em",
});

/** 🎯 通知テキストエリア */
export const toastMessage = style({
  flex: 1,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  color: tokens.color.text.base,
});
