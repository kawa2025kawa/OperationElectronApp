import { style } from "@vanilla-extract/css";

export const buttonGroup = style({
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
  marginTop: "16px",
});

export const primaryButton = style({
  padding: "8px 16px",
  borderRadius: "4px",
  backgroundColor: "#0066cc",
  color: "#ffffff",
  border: "none",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "bold",
  ":disabled": {
    backgroundColor: "#ccc",
    cursor: "not-allowed",
  },
});

export const secondaryButton = style({
  padding: "8px 16px",
  borderRadius: "4px",
  backgroundColor: "#f0f0f0",
  color: "#333333",
  border: "1px solid #ccc",
  cursor: "pointer",
  fontSize: "14px",
  ":disabled": {
    opacity: 0.6,
    cursor: "not-allowed",
  },
});
