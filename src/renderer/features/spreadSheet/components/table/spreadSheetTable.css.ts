import { createVar, style, styleVariants } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

/* -------------------------------------------------------------------------- */
/* CSS Variables                                                              */
/* -------------------------------------------------------------------------- */

const rowTextColor = createVar();
const rowShadow = createVar();
const rowBgColor = createVar();

/* -------------------------------------------------------------------------- */
/* Dimensions                                                                 */
/* -------------------------------------------------------------------------- */

const cardHeight = "56px";
const rowGap = tokens.space.sm;

/*
 * virtualizer の1アイテム分。
 *
 * 56px card
 * + 上下 6pxずつ
 * = 68px
 *
 * OperationTable の borderSpacing: 0 12px と同等の
 * 見た目になるようにする。
 */
const rowSlotHeight = `calc(${cardHeight} + ${rowGap} * 2)`;

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

export const container = style({
  display: "flex",
  flexDirection: "column",

  width: "100%",
  height: "100%",

  overflow: "hidden",

  outline: "none",
});

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

export const headerWrapper = style({
  position: "relative",
  zIndex: 10,

  flexShrink: 0,

  paddingInline: tokens.space.md,

  backgroundColor: tokens.color.bg.base,

  borderRadius: tokens.radius.md,

  boxShadow: tokens.shadow.raised.low,
});

export const headerRow = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",

    width: "100%",
    height: cardHeight,

    boxSizing: "border-box",
  },
]);

/* -------------------------------------------------------------------------- */
/* Body                                                                       */
/* -------------------------------------------------------------------------- */

export const bodyWrapper = style({
  position: "relative",
  zIndex: 0,

  flex: 1,
  minHeight: 0,

  overflowX: "auto",
  overflowY: "auto",

  paddingInline: tokens.space.md,
  paddingTop: tokens.space.sm,
  paddingBottom: tokens.space.md,

  scrollbarGutter: "stable",
});

/* -------------------------------------------------------------------------- */
/* Virtual Body                                                               */
/* -------------------------------------------------------------------------- */

export const virtualBody = style({
  position: "relative",

  width: "100%",
});

/* -------------------------------------------------------------------------- */
/* Virtual Row Slot                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Virtualizer が扱う「1行分の領域」。
 *
 * ここには shadow / background / radius を付けない。
 *
 * 実際のカードは内部の tableRowBase。
 */
export const tableRowSlot = style({
  position: "relative",

  width: "100%",
  height: rowSlotHeight,

  paddingBlock: rowGap,

  boxSizing: "border-box",
});

/* -------------------------------------------------------------------------- */
/* Header Cells                                                               */
/* -------------------------------------------------------------------------- */

export const thBase = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",

    height: "100%",

    paddingInline: tokens.space.lg,

    color: tokens.color.text.base,

    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,

    textTransform: "uppercase",
    letterSpacing: "0.05em",

    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",

    boxSizing: "border-box",

    flexShrink: 0,
  },
]);

export const thAlignVariants = styleVariants({
  left: {
    justifyContent: "flex-start",
  },

  center: {
    justifyContent: "center",
  },

  right: {
    justifyContent: "flex-end",
  },
});

/* -------------------------------------------------------------------------- */
/* Body Row Card                                                              */
/* -------------------------------------------------------------------------- */

/**
 * 実際に見えるカード。
 *
 * 高さは56px固定。
 * 上下の余白は tableRowSlot が担当する。
 */
export const tableRowBase = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",

    width: "100%",
    height: cardHeight,

    borderRadius: tokens.radius.md,

    backgroundColor: rowBgColor,
    color: rowTextColor,

    boxShadow: rowShadow,

    boxSizing: "border-box",

    transition:
      "box-shadow 0.25s ease-out, " +
      "background-color 0.25s ease-out, " +
      "color 0.25s ease-out",
  },
]);

export const tableRowStates = styleVariants({
  idle: {
    vars: {
      [rowBgColor]: tokens.color.bg.base,
      [rowTextColor]: tokens.color.text.base,
      [rowShadow]: tokens.shadow.raised.low,
    },
  },

  clickable: {
    vars: {
      [rowBgColor]: tokens.color.bg.base,
      [rowTextColor]: tokens.color.text.base,
      [rowShadow]: tokens.shadow.raised.low,
    },

    cursor: "pointer",

    selectors: {
      "&:hover": {
        vars: {
          [rowTextColor]: tokens.color.text.hover,
          [rowShadow]: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.md}`,
        },

        zIndex: 1,
      },

      "&:active": {
        vars: {
          [rowShadow]: tokens.shadow.pressed.low,
        },
      },
    },
  },

  selected: {
    vars: {
      [rowBgColor]: tokens.color.bg.base,
      [rowTextColor]: "transparent",
      [rowShadow]: tokens.shadow.pressed.md,
    },
  },

  disabled: {
    vars: {
      [rowBgColor]: tokens.color.bg.base,
      [rowTextColor]: tokens.color.text.base,
      [rowShadow]: tokens.shadow.raised.low,
    },

    opacity: 0.5,

    pointerEvents: "none",

    filter: "grayscale(0.8)",
  },
});

/* -------------------------------------------------------------------------- */
/* Body Cells                                                                 */
/* -------------------------------------------------------------------------- */

export const tdBase = style({
  display: "flex",
  alignItems: "center",

  height: "100%",

  paddingInline: tokens.space.lg,

  color: "inherit",

  fontSize: tokens.font.size.md,
  fontWeight: tokens.font.weight.medium,

  boxSizing: "border-box",

  flexShrink: 0,

  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const tdAlignVariants = styleVariants({
  left: {
    justifyContent: "flex-start",
  },

  center: {
    justifyContent: "center",
  },

  right: {
    justifyContent: "flex-end",
  },
});

/* -------------------------------------------------------------------------- */
/* Cell Content                                                               */
/* -------------------------------------------------------------------------- */

export const cellText = style({
  display: "inline-block",

  maxWidth: "100%",

  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",

  verticalAlign: "middle",

  transition: "color 0.25s ease, filter 0.25s ease",

  selectors: {
    [`${tableRowStates.selected} &`]: {
      backgroundImage: tokens.gradient.brand,

      backgroundClip: "text",
      WebkitBackgroundClip: "text",

      color: "transparent",
      WebkitTextFillColor: "transparent",
    },
  },
});

/* -------------------------------------------------------------------------- */
/* Empty State                                                                */
/* -------------------------------------------------------------------------- */

export const emptyText = style({
  display: "flex",

  alignItems: "center",
  justifyContent: "center",

  minHeight: cardHeight,

  padding: tokens.space.xl,

  color: tokens.color.text.base,

  textAlign: "center",
});
