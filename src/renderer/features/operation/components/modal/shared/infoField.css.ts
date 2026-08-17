import { style, globalStyle } from "@vanilla-extract/css";
import { tokens, themeTransition } from "@renderer/styles/tokens";

export const infoCard = style([
  themeTransition,
  {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.5vmin 2vmin",
    backgroundColor: tokens.color.bg.base,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.raised.md,
    transition: tokens.transition.fast,
    minHeight: "48px",
    selectors: {
      "&:hover": {
        boxShadow: tokens.shadow.glow.cyan,
      },
    },
  },
]);

export const colSpan2 = style([infoCard, { gridColumn: "span 2" }]);
export const colSpan3 = style([infoCard, { gridColumn: "span 3" }]);
export const colSpan6 = style([infoCard, { gridColumn: "span 6" }]);

export const cardLabel = style({
  fontSize: "clamp(11px, 1.8vmin, 15px)",
  fontWeight: tokens.font.weight.medium,
  color: tokens.color.text.base,
  opacity: 0.8,
  userSelect: "none",
  whiteSpace: "nowrap",
  marginRight: "1.5vmin",
});

export const cardValue = style([
  themeTransition,
  {
    fontSize: "clamp(13px, 2.2vmin, 20px)",
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text.base,
    wordBreak: "break-all",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textAlign: "right",
  },
]);

export const commentValue = style([
  cardValue,
  {
    textAlign: "left",
    whiteSpace: "pre-wrap",
    flex: 1,
  },
]);

globalStyle(`${infoCard}:hover ${cardValue}`, {
  color: tokens.color.text.hover,
});
