// src/renderer/features/operation/components/modal/pdfUploadModal/pdfUploadModalContent.css.ts

import { style } from "@vanilla-extract/css";

import { themeTransition, tokens } from "@renderer/styles/tokens";

// ============================================================
// Common
// ============================================================

/**
 * 凹みコンテナ
 */
export const pressed = style([
  themeTransition,
  {
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.pressed.md,
    overflow: "hidden",
  },
]);

/**
 * 省略表示
 */
export const text = style({
  minWidth: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  color: tokens.color.text.base,
});

// ============================================================
// Drop Zone
// ============================================================

export const dropZone = style([
  pressed,
  {
    padding: "24px",
    border: `2px dashed ${tokens.color.border.subtle}`,
    textAlign: "center",
    cursor: "pointer",

    selectors: {
      "&:hover": {
        borderColor: tokens.color.accent.base,
      },
    },
  },
]);

export const dropZoneDragging = style({
  borderColor: tokens.color.accent.base,
});

export const dropZoneDisabled = style({
  opacity: 0.5,
  cursor: "not-allowed",
});

export const dropZoneLabel = style({
  display: "block",
  width: "100%",
  cursor: "pointer",
});

export const dropZoneTitle = style({
  margin: "0 0 8px",
  color: tokens.color.text.base,
  fontWeight: tokens.font.weight.bold,
});

export const dropZoneDescription = style({
  margin: 0,
  color: tokens.color.text.base,
  fontSize: "12px",
  opacity: 0.6,
});

export const hiddenFileInput = style({
  display: "none",
});

// ============================================================
// File List
// ============================================================

export const bottomSection = style({
  display: "flex",
  flex: 1,
  flexDirection: "column",
  gap: "1vmin",
  width: "100%",
  minHeight: 0,
});

export const listBox = style([
  pressed,
  {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    gap: "1vmin",
    minHeight: 0,
    height: "100%",
    padding: "2vmin",
    boxSizing: "border-box",
    overflowY: "auto",
  },
]);

// ============================================================
// Empty
// ============================================================

export const emptyContainer = style({
  display: "flex",
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: 0,
  height: "100%",
  overflow: "hidden",
});

export const emptyText = style([
  themeTransition,
  {
    color: tokens.color.text.base,
    fontSize: "clamp(24px, 6vmin, 64px)",
    fontWeight: tokens.font.weight.bold,
    opacity: 0.12,
    transform: "rotate(-6deg)",
    whiteSpace: "nowrap",
    userSelect: "none",
  },
]);

// ============================================================
// File Item
// ============================================================

export const itemCardRow = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    width: "100%",
    minWidth: 0,
    padding: "1vmin 1.5vmin",
    boxSizing: "border-box",
    gap: tokens.space.xs,

    backgroundColor: tokens.color.bg.base,
    border: `1px solid ${tokens.color.border.subtle}`,
    borderRadius: tokens.radius.sm,
    boxShadow: tokens.shadow.raised.low,
  },
]);

/**
 * ファイル名・パスを縦に並べる領域
 */
export const fileContent = style({
  display: "flex",
  flex: 1,
  flexDirection: "column",
  minWidth: 0,
  gap: "0.25rem",
});

/**
 * ファイル番号 + ファイル名
 */
export const fileNameRow = style({
  display: "flex",
  alignItems: "center",
  minWidth: 0,
  gap: tokens.space.xs,
});

export const fileIndex = style({
  flexShrink: 0,
  minWidth: "24px",
  color: tokens.color.text.base,
  fontWeight: tokens.font.weight.bold,
});

export const fileName = style([
  text,
  {
    fontSize: "clamp(11px, 1.8vmin, 14px)",
    fontWeight: tokens.font.weight.bold,
  },
]);

export const filePath = style([
  text,
  {
    fontSize: "clamp(10px, 1.6vmin, 13px)",
    opacity: 0.7,
  },
]);

// ============================================================
// Reorder
// ============================================================

export const reorderButtons = style({
  display: "flex",
  flexShrink: 0,
  alignItems: "center",
  gap: "4px",
  marginLeft: "auto",
});

export const reorderButton = style([
  themeTransition,
  {
    appearance: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    minWidth: "28px",
    height: "28px",
    padding: 0,

    border: `1px solid ${tokens.color.border.subtle}`,
    borderRadius: tokens.radius.sm,

    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,

    cursor: "pointer",
    userSelect: "none",

    selectors: {
      "&:hover:not(:disabled)": {
        boxShadow: tokens.shadow.raised.low,
      },

      "&:active:not(:disabled)": {
        boxShadow: tokens.shadow.pressed.low,
      },

      "&:disabled": {
        opacity: 0.3,
        cursor: "not-allowed",
      },
    },
  },
]);
