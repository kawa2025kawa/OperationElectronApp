// src/renderer/features/remoteDesktop/rdpView.css.ts

import { createVar, style } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

/* =========================
 * Card Variables (テーブル行と統一)
 * ========================= */
const cardBgColor = createVar();
const cardTextColor = createVar();
const cardShadow = createVar();

/* =========================
 * Layout
 * ========================= */
export const rdpContainer = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "column",
    gap: tokens.space.md,
    padding: tokens.space.xl,
    height: "100%",
    width: "100%",
    boxSizing: "border-box",
    overflowY: "auto",
  },
]);

export const grid = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: tokens.space.lg,
  width: "100%",
});

/* =========================
 * Text Styles
 * ========================= */
export const messageText = style({
  fontSize: tokens.font.size.md,
  color: tokens.color.text.base,
  margin: 0,
});

export const captionText = style({
  fontSize: tokens.font.size.sm,
  color: tokens.color.text.base,
  margin: 0,
});

/* =========================
 * RDP Card (テーブル行のスタイルスタックに準拠)
 * ========================= */
export const card = style([
  themeTransition,
  {
    vars: {
      [cardBgColor]: tokens.color.bg.base,
      [cardTextColor]: tokens.color.text.base,
      [cardShadow]: tokens.shadow.raised.low,
    },
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.space.xl,
    borderRadius: tokens.radius.lg,
    backgroundColor: cardBgColor,
    color: cardTextColor,
    boxShadow: cardShadow,
    cursor: "pointer",
    minHeight: "140px",
    border: "none",
    outline: "none",
    transition:
      "box-shadow 0.25s ease-out, color 0.25s ease-out, background-color 0.25s ease-out, transform 0.25s ease-out",

    selectors: {
      "&:hover": {
        vars: {
          [cardTextColor]: tokens.color.text.hover,
          [cardShadow]: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
        },
        transform: "translateY(-2px)",
        zIndex: 1,
      },
      "&:active": {
        vars: {
          [cardShadow]: tokens.shadow.pressed.low,
        },
        transform: "translateY(0)",
      },
    },
  },
]);

/* =========================
 * Card Title (テキストグラデーション発光)
 * ========================= */
export const cardTitle = style({
  fontSize: tokens.font.size.lg,
  fontWeight: tokens.font.weight.bold,
  color: "inherit",
  textAlign: "center",
  wordBreak: "break-all",
  transition: "color 0.25s ease, filter 0.25s ease",

  selectors: {
    [`${card}:hover &`]: {
      backgroundImage: tokens.gradient.brand,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
    },
  },
});
