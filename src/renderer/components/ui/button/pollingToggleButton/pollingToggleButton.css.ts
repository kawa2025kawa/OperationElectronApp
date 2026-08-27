import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens";

export const button = style({
  position: "relative",
  width: "15rem",
  height: "3rem",
  boxSizing: "border-box",
  padding: `0 ${tokens.space.md}`,
  border: "1px solid transparent",
  outline: "none",
  borderRadius: tokens.radius.full,
  cursor: "pointer",
  whiteSpace: "nowrap",
  overflow: "hidden",

  fontSize: tokens.font.size.md,
  fontWeight: tokens.font.weight.bold,

  transitionProperty:
    "background-color, border-color, color, box-shadow, transform",
  transitionDuration: tokens.transition.ease,
  transitionTimingFunction: "ease-in-out",

  backgroundColor: tokens.color.bg.base,
  color: tokens.color.text.base,
  boxShadow: tokens.shadow.raised.md,

  selectors: {
    "&:hover": {
      boxShadow: tokens.shadow.glow.cyan,
      transform: "translateY(-0.0625rem)",
    },

    "&[aria-pressed='true']": {
      borderColor: "rgba(0, 240, 255, 0.4)",
      boxShadow: `${tokens.shadow.glow.cyan}, inset 0 0 0.75rem rgba(0, 240, 255, 0.15)`,
      backgroundImage: tokens.gradient.brand,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
      WebkitTextFillColor: "transparent",
    },
  },
});

export const content = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  height: "100%",
});

export const indicatorContainer = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1.25em",
  height: "1.25em",
  flexShrink: 0,
});

export const progressRing = style({
  display: "block",
  width: "100%",
  height: "100%",
  transform: "rotate(-90deg)",
});

export const ringBg = style({
  fill: "none",
  stroke: "rgba(0, 240, 255, 0.15)",
  strokeWidth: "2.5",
});

export const ringMeter = style({
  fill: "none",
  stroke: "#00f0ff",
  strokeWidth: "2.5",
  strokeLinecap: "round",
  transition: "stroke-dashoffset 1s linear",
});

export const offlineDot = style({
  display: "block",
  width: "0.5em",
  height: "0.5em",
  borderRadius: "50%",
  backgroundColor: tokens.color.text.base ?? "#666",
});

export const label = style({
  letterSpacing: "0.05em",
  flexGrow: 1,
  textAlign: "center",
  lineHeight: 1.2,
});

// 秒数コンテナの幅と内側余白を微調整して左寄りに移動
export const timerContainer = style({
  width: "2.5em", // 少し広げて可動域を拡大
  paddingRight: "0.5em", // 右端に余白を設けて全体を左寄せに
  display: "inline-flex",
  justifyContent: "center", // 中央寄せで配置安定化
  alignItems: "center",
  flexShrink: 0,
});

export const timerText = style({
  fontSize: tokens.font.size.sm,
  opacity: 0.85,
  fontFamily: "monospace",
  lineHeight: 1.2,
});
