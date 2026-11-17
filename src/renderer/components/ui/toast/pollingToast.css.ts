// src/renderer/components/ui/toast/pollingToast.css.ts

import { style, styleVariants } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { focusRing } from "@renderer/styles/global/surfaces.css";

export const panel = style({
  position: "fixed",
  top: "110px",
  right: "25px",
  width: "min(28vw, 520px)",
  maxHeight: "calc(100vh - 210px)",
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.xs,
  zIndex: tokens.zIndex.toast,
  padding: tokens.space.sm,
  borderRadius: tokens.radius.lg,
  boxSizing: "border-box",

  border: `1px solid ${tokens.glass.contextMenu.border}`,
  backgroundColor: tokens.glass.contextMenu.surface,
  backdropFilter: `blur(${tokens.glass.contextMenu.blur}) saturate(${tokens.glass.contextMenu.saturation})`,
  boxShadow: tokens.shadow.contextMenu,
});

export const header = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexShrink: 0,
  gap: tokens.space.sm,
  paddingLeft: tokens.space.xs,
  paddingBottom: tokens.space.xs,
  marginBottom: tokens.space.xs,
  minHeight: "34px",
  borderBottom: `1px solid ${tokens.color.border.default}`,
});

export const title = style({
  fontFamily: tokens.font.mono,
  color: tokens.color.accent.neonCyan,
  fontSize: tokens.font.size.md,
  fontWeight: tokens.font.weight.bold,
  letterSpacing: "0.06em",
  whiteSpace: "nowrap",
});

export const list = style({
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.xs,
  width: "100%",
  overflowY: "auto",
  overflowX: "hidden",
});

export const item = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: tokens.space.md,
  width: "100%",
  padding: `${tokens.space.sm} ${tokens.space.md}`,
  boxSizing: "border-box",
  borderRadius: tokens.radius.sm,
  border: "1px solid transparent",
  backgroundColor: "rgba(255, 255, 255, 0.03)",
  fontSize: tokens.font.size.md,
  fontWeight: tokens.font.weight.bold,
  lineHeight: 1.4,
  transition: `color ${tokens.transition.ease}, background-color ${tokens.transition.ease}, border-color ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}, transform ${tokens.transition.fast}`,
  selectors: {
    "&:hover": {
      backgroundColor: tokens.color.bg.frostedGlass,
      borderColor: tokens.color.border.highlight,
      boxShadow: tokens.shadow.highlight,
    },
  },
});

export const closeButton = style([
  focusRing,
  {
    appearance: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    padding: tokens.space.xs,
    border: "none",
    borderRadius: tokens.radius.sm,
    background: "transparent",
    color: tokens.color.text.base,
    opacity: 0.6,
    cursor: "pointer",
    fontSize: tokens.font.size.md,
    transition: `opacity ${tokens.transition.fast}, color ${tokens.transition.fast}`,
    selectors: {
      "&:hover, &:focus-visible": {
        color: tokens.color.text.hover,
        opacity: 1,
      },
    },
  },
]);

export const message = style({
  flex: 1,
  minWidth: 0,
  color: "inherit",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const tone = styleVariants({
  error: { color: tokens.color.status.error },
  warning: { color: tokens.color.status.needsAction },
});
