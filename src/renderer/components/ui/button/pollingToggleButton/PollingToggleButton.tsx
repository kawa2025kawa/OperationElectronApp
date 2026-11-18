// src/renderer/components/ui/button/pollingToggleButton/PollingToggleButton.tsx

import { memo } from "react";
import { Toggle } from "@base-ui/react/toggle";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

import { usePollingToggleButton } from "./usePollingToggleButton";
import * as styles from "./pollingToggleButton.css";

type SegmentKey = "a" | "b" | "c" | "d" | "e" | "f" | "g";

const DIGIT_SEGMENTS: Record<string, ReadonlySet<SegmentKey>> = {
  "0": new Set(["a", "b", "c", "d", "e", "f"]),
  "1": new Set(["b", "c"]),
  "2": new Set(["a", "b", "g", "e", "d"]),
  "3": new Set(["a", "b", "g", "c", "d"]),
  "4": new Set(["f", "g", "b", "c"]),
  "5": new Set(["a", "f", "g", "c", "d"]),
  "6": new Set(["a", "f", "g", "e", "c", "d"]),
  "7": new Set(["a", "b", "c"]),
  "8": new Set(["a", "b", "c", "d", "e", "f", "g"]),
  "9": new Set(["a", "b", "c", "d", "f", "g"]),
  "-": new Set(["g"]),
  off: new Set(),
};

const SEGMENT_RECTS: ReadonlyArray<{
  key: SegmentKey;
  x: number;
  y: number;
  w: number;
  h: number;
}> = [
  { key: "a", x: 3.5, y: 1, w: 11, h: 2.6 },
  { key: "b", x: 14.5, y: 3.8, w: 2.6, h: 9.2 },
  { key: "c", x: 14.5, y: 15, w: 2.6, h: 9.2 },
  { key: "d", x: 3.5, y: 24.4, w: 11, h: 2.6 },
  { key: "e", x: 0.9, y: 15, w: 2.6, h: 9.2 },
  { key: "f", x: 0.9, y: 3.8, w: 2.6, h: 9.2 },
  { key: "g", x: 3.5, y: 12.7, w: 11, h: 2.6 },
];

interface SevenSegmentDigitProps {
  char: string;
}

const SevenSegmentDigit = memo(({ char }: SevenSegmentDigitProps) => {
  const activeSet = DIGIT_SEGMENTS[char] ?? DIGIT_SEGMENTS.off;

  return (
    <svg viewBox="0 0 18 28" className={styles.digitSvg} aria-hidden="true">
      {SEGMENT_RECTS.map((seg) => {
        const isOn = activeSet.has(seg.key);
        return (
          <rect
            key={seg.key}
            x={seg.x}
            y={seg.y}
            width={seg.w}
            height={seg.h}
            rx={1.3}
            ry={1.3}
            className={isOn ? styles.segmentOn : styles.segmentOff}
          />
        );
      })}
    </svg>
  );
});

SevenSegmentDigit.displayName = "SevenSegmentDigit";

export const PollingToggleButton = memo(() => {
  const { isPolling, isSyncingNow, remainingSeconds, title, handleClick } =
    usePollingToggleButton();

  const twoDigits = isPolling
    ? String(remainingSeconds).padStart(2, "0")
    : "--";

  return (
    <Toggle
      type="button"
      tabIndex={-1}
      onFocus={(event) => event.currentTarget.blur()}
      className={styles.button}
      pressed={isPolling}
      aria-label={isPolling ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}
      title={title}
      onClick={handleClick}
    >
      {/* 7セグメントLED用のブランドグラデーション定義 */}
      <svg
        width="0"
        height="0"
        style={{ position: "absolute" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="polling-brand-gradient"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="18"
            y2="28"
          >
            <stop offset="0%" stopColor={tokens.color.accent.base} />
            <stop offset="100%" stopColor={tokens.color.accent.neonCyan} />
          </linearGradient>
        </defs>
      </svg>

      <span className={styles.statusGroup}>
        <span className={styles.indicator}>
          <span className={styles.dot} />
        </span>

        <span className={styles.label}>
          <span className={styles.textSpan}>
            {isPolling ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}
          </span>
        </span>
      </span>

      <span className={styles.embeddedClock} aria-hidden="true">
        <span className={styles.clockCaption}>
          {isSyncingNow ? "POLLING" : "NEXT"}
        </span>

        <span className={styles.segmentRow}>
          {isSyncingNow ? (
            <span className={styles.syncText}>SYNC</span>
          ) : (
            <>
              <SevenSegmentDigit char={twoDigits[0]} />
              <SevenSegmentDigit char={twoDigits[1]} />
              <span className={styles.unitText}>S</span>
            </>
          )}
        </span>
      </span>
    </Toggle>
  );
});

PollingToggleButton.displayName = "PollingToggleButton";
