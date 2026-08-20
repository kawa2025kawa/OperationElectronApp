// src/renderer/features/remoteDesktop/rdpView.css.ts

import { createVar, style } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";

/* =========================
 * Card Variables
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

    width: "100%",
    height: "100%",
    padding: tokens.space.xl,
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
 * State Messages
 * ========================= */

export const messageText = style({
  margin: 0,

  color: tokens.color.text.base,
  fontSize: tokens.font.size.md,
});

export const captionText = style({
  margin: 0,

  color: tokens.color.text.base,
  fontSize: tokens.font.size.sm,
});

/* =========================
 * RDP Card
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

    minHeight: "140px",
    padding: tokens.space.xl,

    boxSizing: "border-box",
    border: "none",
    borderRadius: tokens.radius.lg,
    outline: "none",

    backgroundColor: cardBgColor,
    color: cardTextColor,
    boxShadow: cardShadow,

    cursor: "pointer",

    transition: `
      box-shadow ${tokens.transition.ease},
      color ${tokens.transition.ease},
      background-color ${tokens.transition.ease},
      transform ${tokens.transition.ease}
    `,

    selectors: {
      "&:hover": {
        vars: {
          [cardTextColor]: tokens.color.text.hover,
          [cardShadow]: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
        },
        zIndex: 1,
      },

      "&:active": {
        vars: {
          [cardShadow]: tokens.shadow.pressed.low,
        },

        transform: "translateY(0)",
      },

      "&:focus-visible": {
        outline: `2px solid ${tokens.color.accent.base}`,
        outlineOffset: "2px",
      },
    },
  },
]);

/* =========================
 * Card Name
 * ========================= */

export const cardTitle = style({
  color: "inherit",
  fontSize: tokens.font.size.lg,
  fontWeight: tokens.font.weight.bold,
  lineHeight: 1.3,
  textAlign: "center",
  wordBreak: "break-all",

  transition: `
    color ${tokens.transition.ease},
    filter ${tokens.transition.ease}
  `,

  selectors: {
    [`${card}:hover &`]: {
      backgroundImage: tokens.gradient.brand,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      color: "transparent",
    },
  },
});

/* =========================
 * Card Host
 * ========================= */

export const cardHost = style({
  marginTop: tokens.space.xs,

  color: tokens.color.text.base,
  fontFamily: tokens.font.mono,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.medium,
  lineHeight: 1.4,

  textAlign: "center",
  wordBreak: "break-all",
  opacity: 0.75,

  transition: `
    color ${tokens.transition.ease},
    opacity ${tokens.transition.ease}
  `,

  selectors: {
    [`${card}:hover &`]: {
      color: tokens.color.text.hover,
      opacity: 1,
    },
  },
});
