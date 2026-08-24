// src/renderer/features/other/components/modal/pdfUploadModal/pdfUploadModalContent.css.ts

import { style } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

// ============================================================
// Modal Frame
// ============================================================

export const modalContainer = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  width: "100%",
  padding: tokens.space.xl,
  boxSizing: "border-box",
  gap: tokens.space.md,
  overflow: "hidden",
});

export const header = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingBottom: tokens.space.sm,
  borderBottom: `1px solid ${tokens.color.border.subtle}`,
  flexShrink: 0,
});

export const modalTitle = style({
  margin: 0,
  fontSize: tokens.font.size.lg,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.hover,
});

export const contentFlexContainer = style({
  display: "flex",
  flex: 1,
  flexDirection: "column",
  minHeight: 0,
  gap: tokens.space.md,
  overflowY: "auto",
});

export const sectionTitle = style({
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.hover,
});

export const footer = style({
  display: "flex",
  justifyContent: "flex-end",
  gap: tokens.space.sm,
  paddingTop: tokens.space.md,
  borderTop: `1px solid ${tokens.color.border.subtle}`,
  flexShrink: 0,
});

// 🎯 凸（Raised）スタイル適用（transform移動なし）
export const button = style({
  padding: `${tokens.space.sm} ${tokens.space.lg}`,
  borderRadius: tokens.radius.sm,
  border: "none",
  backgroundColor: tokens.color.bg.base,
  color: tokens.color.text.base,
  fontWeight: tokens.font.weight.bold,
  boxShadow: tokens.shadow.raised.low,
  cursor: "pointer",
  transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}`,

  selectors: {
    "&:hover:not(:disabled)": {
      boxShadow: `${tokens.shadow.glow.brand}, ${tokens.shadow.raised.md}`,
      color: tokens.color.text.hover,
    },
    "&:active:not(:disabled)": {
      boxShadow: tokens.shadow.pressed.low,
    },
    "&:disabled": {
      opacity: 0.5,
      boxShadow: "none",
      cursor: "not-allowed",
    },
  },
});

// ============================================================
// UI Panels & Lists
// ============================================================

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

export const text = style({
  minWidth: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  color: tokens.color.text.base,
});

export const dropZone = style([
  pressed,
  {
    padding: tokens.space.lg,
    border: `2px dashed ${tokens.color.border.subtle}`,
    textAlign: "center",
    cursor: "pointer",
    flexShrink: 0,

    selectors: {
      "&:hover:not(:disabled)": {
        borderColor: tokens.color.accent.neonCyan,
        boxShadow: tokens.shadow.glow.cyan,
      },
    },
  },
]);

export const dropZoneDragging = style({
  borderColor: tokens.color.accent.neonCyan,
  boxShadow: tokens.shadow.glow.cyan,
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
    padding: "1.5vmin",
    overflowY: "auto",
  },
]);

export const emptyContainer = style({
  display: "flex",
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: 0,
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

    selectors: {
      "&:hover": {
        borderColor: tokens.color.accent.neonCyan,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      },
    },
  },
]);

export const fileContent = style({
  display: "flex",
  flex: 1,
  flexDirection: "column",
  minWidth: 0,
  gap: "0.25rem",
});

export const fileNameRow = style({
  display: "flex",
  alignItems: "center",
  minWidth: 0,
  gap: tokens.space.xs,
});

export const fileIndex = style({
  flexShrink: 0,
  color: tokens.color.text.base,
  fontWeight: tokens.font.weight.bold,
});

export const fileName = style([
  text,
  {
    fontSize: "clamp(11px, 1.8vmin, 14px)",
    fontWeight: tokens.font.weight.bold,

    selectors: {
      [`${itemCardRow}:hover &`]: {
        color: tokens.color.text.hover,
      },
    },
  },
]);

export const filePath = style([
  text,
  {
    fontSize: "clamp(10px, 1.6vmin, 13px)",
    opacity: 0.7,

    selectors: {
      [`${itemCardRow}:hover &`]: {
        color: tokens.color.text.hover,
      },
    },
  },
]);

export const reorderButtons = style({
  display: "flex",
  flexShrink: 0,
  alignItems: "center",
  gap: "4px",
  marginLeft: "auto",
});

// 🎯 再配置ボタンも同様に凸化（transform移動なし）
export const reorderButton = style([
  themeTransition,
  {
    appearance: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "28px",
    height: "28px",
    padding: 0,

    border: "none",
    borderRadius: tokens.radius.sm,

    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    boxShadow: tokens.shadow.raised.low,

    cursor: "pointer",
    userSelect: "none",

    selectors: {
      "&:hover:not(:disabled)": {
        borderColor: tokens.color.accent.neonCyan,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
        color: tokens.color.text.hover,
      },

      "&:active:not(:disabled)": {
        boxShadow: tokens.shadow.pressed.low,
      },

      "&:disabled": {
        opacity: 0.3,
        boxShadow: "none",
        cursor: "not-allowed",
      },
    },
  },
]);
