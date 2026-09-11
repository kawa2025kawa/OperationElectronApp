import { style } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

// ============================================================
// Shared Base Styles
// ============================================================

const textEllipsis = style({
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const userSelectNone = style({
  userSelect: "none",
});

// カード形状の共通スタイル（リスト枠・Empty枠用）
const cardBaseStyle = style([
  themeTransition,
  {
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.bg.base,
    border: `1px solid ${tokens.color.border.subtle}`,
    boxShadow: tokens.shadow.pressed.md,
  },
]);

// ============================================================
// Container & Drop Zone
// ============================================================

export const container = style([
  {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    // 👇 親コンテナの高さを指定（例: vhや100%など。呼び出し側に合わせる）
    height: "100%", // または "50vh", "clamp(300px, 50vh, 800px)" など
    gap: "1vmin",
  },
]);

export const dropZone = style([
  themeTransition,
  {
    // 👇 高さを比率で管理するため flex を追加
    flex: 4,
    minHeight: 0, // Flex子要素が溢れるのを防ぐCSSの決まり文句

    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: `2px dashed ${tokens.color.border.subtle}`,
    borderRadius: tokens.radius.lg,
    padding: tokens.space.md,
    textAlign: "center",
    cursor: "pointer",
    backgroundColor: "transparent",

    selectors: {
      "&:hover:not([aria-disabled='true'])": {
        borderColor: tokens.color.accent.neonCyan,
        backgroundColor: "rgba(0, 122, 204, 0.05)",
        boxShadow: tokens.shadow.glow.cyan,
      },
      "&:focus-visible": {
        outline: "none",
        borderColor: tokens.color.accent.neonCyan,
        backgroundColor: "rgba(0, 122, 204, 0.05)",
      },
    },
  },
]);

export const dropZoneActive = style({
  borderColor: tokens.color.accent.neonCyan,
  backgroundColor: "rgba(0, 122, 204, 0.05)",
  boxShadow: tokens.shadow.glow.cyan,
});

export const dropZoneDisabled = style({
  cursor: "not-allowed",
  opacity: 0.5,
  pointerEvents: "none",
});

export const hiddenInput = style({ display: "none" });

export const labelText = style([
  userSelectNone,
  {
    margin: 0,
    fontSize: tokens.font.size.sm,
    color: tokens.color.text.base,
  },
]);

// ============================================================
// Selected Files List & Empty State
// ============================================================

export const selectedFilesContainer = style([
  {
    // 👇 高さを比率で管理するため flex を追加
    flex: 6,
    minHeight: 0, // 内部のスクロールを正しく機能させるために必須
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: tokens.space.xs,
  },
]);

export const selectedFilesHeader = style([
  userSelectNone,
  {
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text.hover,
  },
]);

export const selectedFilesList = style([
  cardBaseStyle,
  {
    width: "100%",
    maxHeight: "200px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: tokens.space.xs,
    padding: tokens.space.xs,
  },
]);

export const emptyFileContainer = style([
  cardBaseStyle,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "70px",
    padding: tokens.space.sm,
  },
]);

export const emptyFileText = style([
  userSelectNone,
  {
    fontSize: tokens.font.size.xs,
    fontWeight: tokens.font.weight.bold,
    letterSpacing: "0.08em",
    color: tokens.color.text.base,
    opacity: 0.25,
  },
]);

// ============================================================
// Selected File Row & Content
// ============================================================

export const selectedFileRow = style([
  themeTransition,
  {
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

    selectors: {
      "&:hover": {
        borderColor: tokens.color.accent.neonCyan,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
      },
    },
  },
]);

export const selectedFileContent = style({
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
    selectors: {
      [`${selectedFileRow}:hover &`]: { color: tokens.color.text.hover },
    },
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
    selectors: {
      [`${selectedFileRow}:hover &`]: { color: tokens.color.text.hover },
    },
  },
]);

// ============================================================
// Action Buttons
// ============================================================

export const actionButtonsRow = style({
  display: "flex",
  alignItems: "center",
  gap: tokens.space.xs,
  flexShrink: 0,
});

export const iconButton = style([
  themeTransition,
  {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "26px",
    height: "26px",
    padding: 0,
    borderRadius: tokens.radius.sm,
    border: `1px solid ${tokens.color.border.subtle}`,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    fontSize: "11px",
    cursor: "pointer",

    selectors: {
      "&:hover:not(:disabled)": {
        borderColor: tokens.color.accent.neonCyan,
        color: tokens.color.text.hover,
        boxShadow: tokens.shadow.glow.cyan,
      },
      "&:disabled": {
        opacity: 0.25,
        cursor: "not-allowed",
      },
      "&:active:not(:disabled)": {
        transform: "scale(0.95)",
      },
    },
  },
]);

export const removeFileButton = style({
  selectors: {
    "&:hover:not(:disabled)": {
      borderColor: "#ff4d4f",
      color: "#ff4d4f",
      boxShadow: "0 0 8px rgba(255, 77, 79, 0.4)",
    },
  },
});
