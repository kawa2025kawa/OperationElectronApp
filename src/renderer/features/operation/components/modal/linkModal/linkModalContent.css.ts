import { style } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

const BADGE_WIDTH = "120px";

/* ============================================================
 * Base Styles
 * ============================================================ */

const rowBaseStyle = style({
  display: "flex",
  alignItems: "center",
  gap: tokens.space.md,
  padding: `${tokens.space.xs} ${tokens.space.sm}`,
  width: "100%",
  boxSizing: "border-box",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
});

/* ============================================================
 * Container & Layouts
 * ============================================================ */

export const contentContainer = style({
  display: "flex",
  flexDirection: "column",
  gap: tokens.space.md,
  width: "100%",
  height: "100%",
});

export const sectionTitle = style({
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
});

export const terminalSection = style({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  width: "100%",
  overflowY: "auto",
  padding: tokens.space.xs, // 影の欠けを防ぐためのパディング
});

/* ============================================================
 * Row & Cell Styles (Card & Text)
 * ============================================================ */

export const terminalRow = style([
  rowBaseStyle,
  themeTransition,
  {
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.low,
    transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}, color ${tokens.transition.fast}`,
    selectors: {
      "&:hover, &:focus-visible": {
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
        color: tokens.color.text.hover,
        transform: "translateY(-1px)",
        outline: "none",
      },
      "&:active": {
        boxShadow: tokens.shadow.pressed.low,
        transform: "translateY(0px)",
      },
    },
  },
]);

export const terminalBadge = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: BADGE_WIDTH,
  minHeight: "36px", // 🎯 height から minHeight に変更（折り返し時に高さを拡張）
  height: "auto",
  paddingTop: "4px",
  paddingBottom: "4px",
  flexShrink: 0,
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.sm,
  boxShadow: tokens.shadow.pressed.md,
  color: tokens.color.accent.base,
  fontWeight: tokens.font.weight.bold,
  fontSize: tokens.font.size.xs, // 🎯 12px程度の小さめサイズに調整
  letterSpacing: "0.5px",
  lineHeight: "1.2", // 🎯 折返し時の行間を詰める
  wordBreak: "break-all", // 🎯 長い日本語・英字を枠内で安全に折り返す
});

export const nonTrBadge = style([
  terminalBadge,
  {
    width: BADGE_WIDTH,
    justifyContent: "flex-start",
    paddingLeft: "12px",
    paddingRight: "8px",
    boxSizing: "border-box",
  },
]);

export const flexCell = style({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minWidth: 0,
  flex: 1,
});

export const cellValue = style({
  fontSize: tokens.font.fluid.md,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  transition: tokens.transition.fast,
  selectors: {
    [`${terminalRow}:hover &`]: {
      color: tokens.color.text.hover,
    },
  },
});
