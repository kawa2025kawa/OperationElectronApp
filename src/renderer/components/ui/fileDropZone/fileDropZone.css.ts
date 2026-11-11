// src/renderer/components/ui/fileDropZone/fileDropZone.css.ts

import { globalStyle, style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

const glassSurface = {
  backgroundColor: tokens.glass.surface,
  backdropFilter: "blur(12px) saturate(180%)",
  WebkitBackdropFilter: "blur(12px) saturate(180%)",
} as const;

export const hiddenInput = style({
  display: "none",
});

export const container = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: 0,
  gap: tokens.space.xs,
});

export const selectedFilesHeader = style({
  userSelect: "none",
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.hover,
});

/* 空状態のドロップエリア */
export const unifiedEmptyDropArea = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "160px",
    padding: tokens.space.lg,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.bg.base,
    border: `2px dashed ${tokens.color.border.subtle}`,
    cursor: "pointer",
    userSelect: "none",
    selectors: {
      "&:hover:not([aria-disabled='true'])": {
        borderColor: tokens.color.accent.neonCyan,
        backgroundColor: "rgba(0, 122, 204, 0.05)",
        boxShadow: tokens.shadow.glow.cyan,
      },
      "&.is-active": {
        borderColor: tokens.color.accent.neonCyan,
        backgroundColor: "rgba(0, 122, 204, 0.08)",
        boxShadow: tokens.shadow.glow.cyan,
      },
    },
  },
]);

globalStyle(`${unifiedEmptyDropArea} > .primary-label`, {
  marginBottom: tokens.space.xs,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
});

globalStyle(`${unifiedEmptyDropArea} > .sub-label`, {
  fontSize: tokens.font.size.xs,
  opacity: 0.6,
});

/* ファイルリスト */
export const unifiedFilesList = style({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  gap: tokens.space.xs,
  padding: tokens.space.xs,
  overflowY: "auto",
  scrollbarGutter: "stable",
  borderRadius: tokens.radius.md,
  backgroundColor: tokens.color.bg.base,
  border: `1px solid ${tokens.color.border.subtle}`,
  boxShadow: tokens.shadow.pressed.md,
  selectors: {
    "&.is-active": {
      borderColor: tokens.color.accent.neonCyan,
      boxShadow: tokens.shadow.glow.cyan,
    },
  },
});

/* 各行 */
export const selectedFileRow = style([
  themeTransition,
  {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${tokens.space.xs} ${tokens.space.sm}`,
    gap: tokens.space.sm,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.bg.base,
    border: `1px solid ${tokens.color.border.subtle}`,
    boxShadow: tokens.shadow.raised.low,
    zIndex: tokens.zIndex.base,
    selectors: {
      "&:hover": {
        borderColor: tokens.color.accent.neonCyan,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      },
      "&.is-open": {
        zIndex: tokens.zIndex.dropdown,
      },
      "&.is-dragging": {
        cursor: "grabbing",
        opacity: 0.4,
      },
      "&.is-drop-target": {
        borderColor: tokens.color.accent.neonCyan,
        transform: "scale(1.01)",
      },
    },
  },
]);

globalStyle(`${selectedFileRow} > .file-info`, {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minWidth: 0,
  gap: "2px",
});

globalStyle(`${selectedFileRow} > .file-info > .file-title`, {
  display: "flex",
  alignItems: "center",
  gap: tokens.space.xs,
  minWidth: 0,
});

globalStyle(`${selectedFileRow} > .file-info > .file-title > .index`, {
  userSelect: "none",
  flexShrink: 0,
  fontSize: tokens.font.size.xs,
  fontWeight: tokens.font.weight.bold,
});

globalStyle(`${selectedFileRow} > .file-info > .file-title > .name`, {
  display: "block",
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
});

globalStyle(`${selectedFileRow} > .file-info > .path`, {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: tokens.font.size.xs,
  opacity: 0.7,
  fontFamily: "monospace",
});

globalStyle(`${selectedFileRow} > .file-actions`, {
  display: "flex",
  alignItems: "center",
  gap: tokens.space.sm,
  flexShrink: 0,
});

/* ドロップダウン */
export const dropdownWrapper = style({
  position: "relative",
  width: "220px",
  flexShrink: 0,
});

export const dropdownTrigger = style([
  themeTransition,
  {
    appearance: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: "36px",
    padding: `0 ${tokens.space.md}`,
    borderRadius: tokens.radius.sm,
    ...glassSurface,
    border: `1px solid ${tokens.color.border.subtle}`,
    boxShadow: tokens.shadow.raised.low,
    color: tokens.color.text.base,
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    cursor: "pointer",
    selectors: {
      "&:hover": {
        borderColor: tokens.color.accent.neonCyan,
        color: tokens.color.text.hover,
      },
    },
  },
]);

globalStyle(`${dropdownTrigger} > .arrow`, {
  fontSize: "9px",
  opacity: 0.7,
  pointerEvents: "none",
});

export const dropdownMenu = style({
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  right: 0,
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  maxHeight: "220px",
  padding: tokens.space.xs,
  overflowY: "auto",
  scrollbarGutter: "stable",
  borderRadius: tokens.radius.md,
  ...glassSurface,
  border: `2px solid ${tokens.color.border.subtle}`,
  boxShadow: tokens.shadow.raised.high,
  zIndex: tokens.zIndex.contextMenu,
});

export const dropdownItem = style([
  themeTransition,
  {
    appearance: "none",
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: `${tokens.space.sm} ${tokens.space.md}`,
    border: "none",
    borderRadius: tokens.radius.sm,
    background: "none",
    color: tokens.color.text.hover,
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    textAlign: "left",
    whiteSpace: "nowrap",
    cursor: "pointer",
    selectors: {
      "&:hover, &:focus-visible": {
        backgroundColor: tokens.color.bg.frostedGlass,
        color: tokens.color.accent.neonCyan,
      },
    },
  },
]);

/* 削除ボタン */
export const removeFileButton = style([
  themeTransition,
  {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    flexShrink: 0,
    borderRadius: tokens.radius.sm,
    border: `1px solid ${tokens.color.border.subtle}`,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    cursor: "pointer",
    fontSize: "16px",
    lineHeight: 1,
    selectors: {
      "&:hover": {
        borderColor: "#ff4d4f",
        color: "#ff4d4f",
      },
    },
  },
]);
