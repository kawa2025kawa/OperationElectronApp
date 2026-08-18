// src/renderer/components/ui/toast/toast.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

/** 🎯 通知パネルコンテナ (statusContextMenu の content と同じ質感) */
export const notificationPanelWrapper = style({
  position: "fixed",
  top: "110px",
  bottom: "100px",
  right: "25px",
  width: "min(28vw, 520px)",
  maxHeight: "75vh",

  display: "flex",
  flexDirection: "column",
  gap: tokens.space.xs,

  zIndex: tokens.zIndex.toast,
  padding: tokens.space.xs,
  borderRadius: tokens.radius.lg,

  /* StatusContextMenu (content) と同じ背景・枠線・ブラー */
  backgroundColor: "rgba(0, 0, 0, 0.45)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "2px solid rgba(0, 0, 0, 0.6)",
  boxShadow: tokens.shadow.raised.high,
  isolation: "isolate",

  overflowY: "auto",
  scrollbarWidth: "none",

  selectors: {
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
});

/** 🎯 パネルヘッダー (statusContextMenu の header と同じ) */
export const headerWrapper = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: `${tokens.space.xs} ${tokens.space.sm}`,
  borderBottom: `1px solid ${tokens.color.border.default}`,
  marginBottom: tokens.space.xs,
  gap: tokens.space.md,
  flexShrink: 0,
});

/** 🎯 ヘッダータイトル (statusContextMenu の headerTitle と同じ) */
export const panelHeader = style({
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  whiteSpace: "nowrap",
});

export const toastList = style({
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.xs,
  width: "100%",
});

/** 🎯 トーストカードベース (statusContextMenu の itemBase と同じ質感・アニメーション) */
export const toastBase = style([
  themeTransition,
  {
    position: "relative",
    display: "flex",
    alignItems: "center",
    width: "100%",
    gap: tokens.space.md,
    padding: `${tokens.space.sm} ${tokens.space.md}`,
    borderRadius: tokens.radius.sm,
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    boxSizing: "border-box",

    backgroundColor: "transparent",
    border: `1px solid ${tokens.color.border.subtle}`,
    boxShadow: tokens.shadow.raised.low,

    transition: `
      box-shadow ${tokens.transition.ease},
      color ${tokens.transition.ease},
      background-color ${tokens.transition.ease},
      transform ${tokens.transition.fast}
    `,

    selectors: {
      "&:hover": {
        backgroundColor: tokens.color.bg.inset,
        transform: "translateX(2px)",
        boxShadow: tokens.shadow.raised.md,
      },
    },
  },
]);

/** 🎯 閉じるボタン */
export const closeBadgeButton = style({
  appearance: "none",
  border: "none",
  outline: "none",
  background: "transparent",
  color: tokens.color.text.base,
  opacity: 0.6,
  cursor: "pointer",
  padding: tokens.space.xs,
  fontSize: tokens.font.size.sm,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: `opacity ${tokens.transition.fast}`,

  selectors: {
    "&:hover": {
      opacity: 1,
    },
  },
});

/** 🎯 アイコン */
export const toastIcon = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  fontSize: tokens.font.size.md,
});

export const toastMessage = style({
  flex: 1,
  color: "inherit",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
});

/** 🎯 StatusContextMenu (itemVariants) と完全に一致するカラーバリエーション */
export const toastTone = styleVariants({
  success: {
    color: tokens.color.status.success,
  },
  error: {
    color: tokens.color.status.error,
  },
  warning: {
    color: tokens.color.status.waiting,
  },
  info: {
    color: tokens.color.status.ready,
  },
});
