// src/renderer/components/ui/fileDropZone/fileDropZone.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

const textEllipsis = style({
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const userSelectNone = style({
  userSelect: "none",
});

const cardBaseStyle = style([
  themeTransition,
  {
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.bg.base,
    border: `1px solid ${tokens.color.border.subtle}`,
    boxShadow: tokens.shadow.pressed.md,
  },
]);

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
  boxSizing: "border-box",
});

export const selectedFilesHeader = style([
  userSelectNone,
  {
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text.hover,
  },
]);

export const unifiedFilesList = style([
  cardBaseStyle,
  {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
    width: "100%",
    gap: tokens.space.xs,
    padding: tokens.space.xs,
    overflowY: "auto",
    boxSizing: "border-box",
    selectors: {
      "&:focus-visible": {
        outline: "none",
        borderColor: tokens.color.accent.neonCyan,
      },
    },
  },
]);

export const unifiedFilesListActive = style({
  borderColor: tokens.color.accent.neonCyan,
  backgroundColor: "rgba(0, 122, 204, 0.05)",
  boxShadow: tokens.shadow.glow.cyan,
});

export const unifiedEmptyDropArea = style([
  cardBaseStyle,
  {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: "160px",
    padding: tokens.space.lg,
    boxSizing: "border-box",
    cursor: "pointer",
    border: `2px dashed ${tokens.color.border.subtle}`,
    selectors: {
      "&:hover:not([aria-disabled='true'])": {
        borderColor: tokens.color.accent.neonCyan,
        backgroundColor: "rgba(0, 122, 204, 0.05)",
        boxShadow: tokens.shadow.glow.cyan,
      },
    },
  },
]);

export const unifiedEmptyDropAreaActive = style({
  borderColor: tokens.color.accent.neonCyan,
  backgroundColor: "rgba(0, 122, 204, 0.08)",
  boxShadow: tokens.shadow.glow.cyan,
});

export const emptyFilePrimaryText = style([
  userSelectNone,
  {
    marginBottom: tokens.space.xs,
    fontSize: tokens.font.size.sm,
    color: tokens.color.text.hover,
    fontWeight: tokens.font.weight.bold,
  },
]);

export const emptyFileSubText = style([
  userSelectNone,
  {
    fontSize: tokens.font.size.xs,
    color: tokens.color.text.base,
    opacity: 0.6,
  },
]);

export const selectedFileRow = style([
  themeTransition,
  {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: `${tokens.space.xs} ${tokens.space.sm}`,
    gap: tokens.space.sm,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.bg.base,
    border: `1px solid ${tokens.color.border.subtle}`,
    boxShadow: tokens.shadow.raised.low,
    boxSizing: "border-box",
    transition: `border-color ${tokens.transition.fast}`,

    "::before": {
      content: '""',
      position: "absolute",
      inset: -1,
      borderRadius: tokens.radius.sm,
      boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      opacity: 0,
      transition: `opacity ${tokens.transition.normal}`,
      pointerEvents: "none",
    },

    selectors: {
      "&:hover": {
        borderColor: tokens.color.accent.neonCyan,
      },
      "&:hover::before": {
        opacity: 1,
      },
    },
  },
]);

export const selectedFileRowDragging = style({
  cursor: "grabbing",
  opacity: 0.4,
});

export const selectedFileRowDropTarget = style({
  borderColor: tokens.color.accent.neonCyan,
  transform: "scale(1.01)",
});

export const selectedFileContent = style({
  position: "relative",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  width: "100%",
  minWidth: 0,
  gap: "2px",
});

export const selectedFileNameRow = style({
  display: "flex",
  alignItems: "center",
  width: "100%",
  minWidth: 0,
  gap: tokens.space.xs,
});

export const selectedFileIndex = style([
  userSelectNone,
  {
    flexShrink: 0,
    fontSize: tokens.font.size.xs,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text.base,
  },
]);

export const selectedFileName = style([
  textEllipsis,
  {
    flex: 1,
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text.base,
  },
]);

export const selectedFilePath = style([
  textEllipsis,
  {
    display: "block",
    width: "100%",
    fontSize: tokens.font.size.xs,
    color: tokens.color.text.base,
    opacity: 0.7,
    fontFamily: "monospace",
  },
]);

export const rowActions = style({
  position: "relative",
  zIndex: 1,
  display: "flex",
  alignItems: "center",
  gap: tokens.space.sm,
  flexShrink: 0,
});

export const dropdownWrapper = style({
  position: "relative",
  display: "inline-block",
  width: "180px",
});

export const dropdownTrigger = style([
  themeTransition,
  {
    appearance: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.space.xs,
    width: "100%",
    height: "32px",
    padding: `0 ${tokens.space.sm}`,
    borderRadius: tokens.radius.sm,
    ...glassSurface,
    border: `1px solid ${tokens.color.border.subtle}`,
    boxShadow: tokens.shadow.raised.low,
    color: tokens.color.text.base,
    fontSize: tokens.font.size.xs,
    fontWeight: tokens.font.weight.bold,
    outline: "none",
    cursor: "pointer",
    boxSizing: "border-box",
    selectors: {
      "&:hover": {
        borderColor: tokens.color.accent.neonCyan,
        boxShadow: tokens.shadow.highlight,
        color: tokens.color.text.hover,
      },
      "&:focus-visible": {
        borderColor: tokens.color.accent.neonCyan,
        boxShadow: tokens.shadow.highlight,
      },
    },
  },
]);

export const dropdownArrow = style({
  fontSize: "8px",
  color: tokens.color.text.base,
  opacity: 0.7,
  pointerEvents: "none",
});

export const dropdownMenu = style({
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  right: 0,
  width: "100%",
  padding: tokens.space.xs,
  borderRadius: tokens.radius.lg,
  ...glassSurface,
  border: `2px solid ${tokens.color.border.subtle}`,
  boxShadow: tokens.shadow.raised.high,
  zIndex: tokens.zIndex.contextMenu,
  isolation: "isolate",
  transform: "translateZ(0)",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
});

export const dropdownList = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  maxHeight: "200px",
  overflowY: "auto",
});

export const dropdownItem = style([
  themeTransition,
  {
    appearance: "none",
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: `${tokens.space.xs} ${tokens.space.sm}`,
    border: "none",
    borderRadius: tokens.radius.sm,
    outline: "none",
    background: "none",
    color: tokens.color.text.hover,
    fontSize: tokens.font.size.xs,
    fontWeight: tokens.font.weight.bold,
    textAlign: "left",
    whiteSpace: "nowrap",
    cursor: "pointer",
    boxSizing: "border-box",
    selectors: {
      "&:hover": {
        backgroundColor: tokens.color.bg.frostedGlass,
        boxShadow: tokens.shadow.highlight,
        color: tokens.color.accent.neonCyan,
      },
      "&:focus-visible": {
        backgroundColor: tokens.color.bg.frostedGlass,
        boxShadow: tokens.shadow.highlight,
      },
    },
  },
]);

export const removeFileButton = style([
  themeTransition,
  {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: tokens.radius.sm,
    border: `1px solid ${tokens.color.border.subtle}`,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    cursor: "pointer",
    fontSize: "16px",
    lineHeight: 1,
    boxSizing: "border-box",
    selectors: {
      "&:hover": {
        borderColor: "#ff4d4f",
        color: "#ff4d4f",
        boxShadow: "0 0 8px rgba(255, 77, 79, 0.4)",
      },
    },
  },
]);
