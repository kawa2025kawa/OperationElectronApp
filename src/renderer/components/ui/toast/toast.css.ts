import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

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

  backgroundColor: "rgba(0, 0, 0, 0.45)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",

  border: "2px solid rgba(0, 0, 0, 0.6)",
  boxShadow: tokens.shadow.raised.high,

  overflowY: "auto",
  scrollbarWidth: "none",

  selectors: {
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
});

export const headerWrapper = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingInline: "0.5vmin",
  flexShrink: 0,
});

export const panelHeader = style({
  fontSize: "clamp(11px, 1.8vmin, 14px)",
  fontWeight: 700,
  letterSpacing: "0.05em",
  opacity: 0.6,
  textTransform: "uppercase",
  color: tokens.color.text.onAccent,
});

export const toastList = style({
  display: "flex",
  flexDirection: "column",
  gap: "1vmin",
  minHeight: 0,
});

export const toastBase = style({
  padding: "1.5vmin 2vmin",
  borderRadius: tokens.radius.sm,

  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",

  fontSize: "clamp(12px, 2vmin, 15px)",
  fontWeight: 800,
  lineHeight: 1.4,

  flexShrink: 0,

  backgroundColor: tokens.color.bg.base,
  boxShadow: tokens.shadow.raised.low,
  border: `1px solid ${tokens.color.border.subtle}`,
});

export const toastMessage = style({
  flex: 1,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
});
