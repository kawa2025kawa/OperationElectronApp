import { style, styleVariants } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

// ============================================================
// Overlay (背景遮蔽)
// ============================================================
export const overlay = style({
  position: "fixed",
  inset: 0,
  zIndex: tokens.zIndex.modal,
  backgroundColor: "rgba(0, 0, 0, 0.65)",
  backdropFilter: `blur(${tokens.glass.blur ?? "8px"})`,
  WebkitBackdropFilter: `blur(${tokens.glass.blur ?? "8px"})`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: tokens.space.md,
  boxSizing: "border-box",
});

// ============================================================
// Modal Window (モーダル外枠)
// ============================================================
export const modalWindow = style([
  themeTransition,
  {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.raised.high,
    border: `1px solid ${tokens.color.border.subtle}`,
    outline: "none",
    overflow: "hidden",
    boxSizing: "border-box",
    flexShrink: 0,
    flexGrow: 0,
    maxHeight: "90vh",
    maxWidth: "92vw",
  },
]);

// ============================================================
// Header / Title
// ============================================================
export const header = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `${tokens.space.md} ${tokens.space.lg}`,
  borderBottom: `1px solid ${tokens.color.border.subtle}`,
  flexShrink: 0,
  gap: tokens.space.md,
});

export const title = style({
  margin: 0,
  fontSize: tokens.font.size.lg,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.hover,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

// ============================================================
// Body (スクロール可能なコンテンツ領域)
// ============================================================
export const body = style({
  display: "flex",
  flex: 1,
  flexDirection: "column",
  minHeight: 0, // 🎯 Flex配下での縦崩れ・はみ出しを防止
  padding: tokens.space.lg,
  overflowY: "auto", // 🎯 長いコンテンツのみここをスクロール
  overflowX: "hidden",
  boxSizing: "border-box",
  gap: tokens.space.md,
});

// ============================================================
// Footer (最下部固定アクションエリア)
// ============================================================
export const footer = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: `${tokens.space.md} ${tokens.space.lg}`,
  borderTop: `1px solid ${tokens.color.border.subtle}`,
  backgroundColor: tokens.color.bg.base,
  flexShrink: 0, // 🎯 スクロール時も最下部に完全固定
  gap: tokens.space.sm,
});

/**
 * デフォルト閉じるボタン用 Neumorphism スタイル
 */
export const defaultCloseButton = style([
  themeTransition,
  {
    border: "none",
    cursor: "pointer",
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    fontWeight: tokens.font.weight.bold,
    fontSize: tokens.font.size.sm,
    outline: "none",
    boxShadow: tokens.shadow.raised.low,
    borderRadius: tokens.radius.md,
    padding: "8px 20px",
    whiteSpace: "nowrap",
    selectors: {
      "&:hover": {
        color: tokens.color.text.hover,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      },
      "&:active": {
        boxShadow: tokens.shadow.pressed.low,
      },
    },
  },
]);

/* -------------------------------------------------------------------------- */
/* メッセージバナー基本スタイル                                                */
/* -------------------------------------------------------------------------- */

export const messageBanner = style({
  display: "flex",
  alignItems: "center",
  padding: `${tokens.space.sm} ${tokens.space.lg}`,
  margin: `0 ${tokens.space.xl} ${tokens.space.md} ${tokens.space.xl}`,
  borderRadius: tokens.radius.sm,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.normal,
  lineHeight: 1.5,
  wordBreak: "break-word",
  transition: tokens.transition.normal,
  backdropFilter: `blur(${tokens.glass.blur})`,
});

/* -------------------------------------------------------------------------- */
/* メッセージタイプ別バリアント (info | success | error | warning)              */
/* -------------------------------------------------------------------------- */

export const messageTypes = styleVariants({
  // info: waiting トークンを適用
  info: {
    backgroundColor: tokens.color.bg.frostedGlass,
    color: tokens.color.status.waiting,
    border: `1px solid ${tokens.color.status.waiting}`,
    boxShadow: tokens.shadow.glow.waiting,
  },
  // success: success トークンを適用
  success: {
    backgroundColor: tokens.color.bg.frostedGlass,
    color: tokens.color.status.success,
    border: `1px solid ${tokens.color.status.success}`,
    boxShadow: tokens.shadow.glow.success,
  },
  // error: error トークンを適用
  error: {
    backgroundColor: tokens.color.bg.frostedGlass,
    color: tokens.color.status.error,
    border: `1px solid ${tokens.color.status.error}`,
    boxShadow: tokens.shadow.glow.error,
  },
  // warning: running トークンを適用
  warning: {
    backgroundColor: tokens.color.bg.frostedGlass,
    color: tokens.color.status.running,
    border: `1px solid ${tokens.color.status.running}`,
    boxShadow: tokens.shadow.glow.running,
  },
});
