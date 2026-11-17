// src/renderer/features/operation/components/operationInfoRow/operationInfoRow.css.ts

import { style, globalStyle } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

import {
  interactiveGlowCard,
  textEllipsis,
} from "@renderer/styles/global/surfaces.css";

export const row = style([
  interactiveGlowCard,
  {
    display: "flex",
    alignItems: "center",
    width: `calc(100% - ${tokens.space.sm} * 2)`,
    marginInline: "auto",
    boxSizing: "border-box",
    padding: `${tokens.space.sm} ${tokens.space.md}`,
    minHeight: "44px",

    selectors: {
      "&[data-remarks='true']": {
        flexDirection: "column",
        alignItems: "flex-start",
        height: "auto",
        gap: tokens.space.xs,
      },
    },
  },
]);

globalStyle(`${row} > span:first-child`, {
  position: "relative",
  zIndex: 1,
  flexShrink: 0,
  fontSize: tokens.font.size.sm,
  fontWeight: tokens.font.weight.bold,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  whiteSpace: "nowrap",
});

export const resultValue = style([
  textEllipsis,

  {
    position: "relative",
    zIndex: 1,
    flex: 1,
    paddingLeft: tokens.space.md,
    textAlign: "right",
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.medium,

    selectors: {
      [`${row}[data-remarks='true'] &`]: {
        width: "100%",
        paddingLeft: 0,
        marginTop: tokens.space.xs,
        textAlign: "left",
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
        lineHeight: 1.6,
        maxHeight: "160px",
        overflowY: "auto",
        overflowX: "hidden",
      },
    },
  },
]);
