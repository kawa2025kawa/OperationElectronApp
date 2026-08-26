import { style } from "@vanilla-extract/css";

// ============================================================
// Container
// ============================================================

export const container = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  gap: "1vmin",
  boxSizing: "border-box",
});

// ============================================================
// Drop Zone
// ============================================================

export const dropZone = style({
  border: "2px dashed #ccc",
  borderRadius: "8px",
  padding: "24px",
  textAlign: "center",
  cursor: "pointer",
  backgroundColor: "transparent",
  transition: "all 0.2s ease",
  boxSizing: "border-box",

  ":hover": {
    borderColor: "#007acc",
    backgroundColor: "rgba(0, 122, 204, 0.05)",
  },

  ":focus-visible": {
    outline: "none",
    borderColor: "#007acc",
    backgroundColor: "rgba(0, 122, 204, 0.05)",
  },
});

export const dropZoneActive = style({
  borderColor: "#007acc",
  backgroundColor: "rgba(0, 122, 204, 0.05)",
});

export const dropZoneDisabled = style({
  cursor: "not-allowed",
  opacity: 0.5,
  pointerEvents: "none",

  ":hover": {
    borderColor: "#ccc",
    backgroundColor: "transparent",
  },
});

// ============================================================
// Input
// ============================================================

export const hiddenInput = style({
  display: "none",
});

// ============================================================
// Drop Zone Label
// ============================================================

export const labelText = style({
  margin: 0,
  fontSize: "14px",
  color: "var(--text-secondary)",
  userSelect: "none",
});

// ============================================================
// Selected Files
// ============================================================

export const selectedFilesContainer = style({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  boxSizing: "border-box",
});

export const selectedFilesHeader = style({
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--text-primary)",
  userSelect: "none",
});

export const selectedFilesList = style({
  width: "100%",
  maxHeight: "180px",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "8px",
  boxSizing: "border-box",
  borderRadius: "8px",
  backgroundColor: "var(--background-secondary)",
  border: "1px solid var(--border-color)",
});

// ============================================================
// Empty
// ============================================================

export const emptyFileContainer = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "70px",
  padding: "12px",
  boxSizing: "border-box",
  borderRadius: "8px",
  backgroundColor: "var(--background-secondary)",
  border: "1px solid var(--border-color)",
});

export const emptyFileText = style({
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  color: "var(--text-secondary)",
  userSelect: "none",
});

// ============================================================
// Selected File Row
// ============================================================

export const selectedFileRow = style({
  display: "flex",
  alignItems: "center",
  width: "100%",
  padding: "8px 10px",
  boxSizing: "border-box",
  borderRadius: "6px",
  backgroundColor: "var(--background-primary)",
  border: "1px solid var(--border-color)",
});

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
  gap: "8px",
});

export const selectedFileIndex = style({
  flexShrink: 0,
  fontSize: "12px",
  fontWeight: 600,
  color: "#007acc",
  userSelect: "none",
});

export const selectedFileName = style({
  flex: 1,
  minWidth: 0,
  fontSize: "13px",
  fontWeight: 500,
  color: "var(--text-primary)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const selectedFilePath = style({
  display: "block",
  width: "100%",
  minWidth: 0,
  fontSize: "11px",
  color: "var(--text-secondary)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontFamily: "monospace",
});

// ============================================================
// Remove Button
// ============================================================

export const removeFileButton = style({
  flexShrink: 0,
  width: "28px",
  height: "28px",
  marginLeft: "auto",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: "4px",
  backgroundColor: "transparent",
  color: "var(--text-primary)",
  fontSize: "20px",
  fontWeight: 700,
  lineHeight: 1,
  cursor: "pointer",
  boxSizing: "border-box",

  ":hover": {
    color: "#007acc",
    backgroundColor: "var(--background-secondary)",
  },

  ":active": {
    transform: "scale(0.95)",
  },

  ":focus-visible": {
    outline: "none",
    color: "#007acc",
    backgroundColor: "var(--background-secondary)",
  },
});
