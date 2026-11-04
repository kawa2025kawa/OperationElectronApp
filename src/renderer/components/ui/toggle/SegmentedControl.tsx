// src/renderer/components/ui/toggle/SegmentedControl.tsx

import { memo } from "react";
import { motion } from "motion/react";
import * as styles from "./segmentedControl.css";

export interface SegmentedControlItem<T extends string | number> {
  readonly id: T;
  readonly label: string;
}

export interface SegmentedControlProps<T extends string | number> {
  /** layoutId の衝突を防ぐためのユニークプレフィックス */
  readonly id: string;
  readonly items: readonly SegmentedControlItem<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly size?: "sm" | "md" | "lg";
  readonly fullWidth?: boolean;
  readonly className?: string;
}

function SegmentedControlInner<T extends string | number>({
  id,
  items,
  value,
  onChange,
  size = "md",
  fullWidth = true,
  className,
}: SegmentedControlProps<T>) {
  const containerClasses = [
    styles.containerBase,
    styles.containerSize[size],
    styles.containerWidth[fullWidth ? "full" : "auto"],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const buttonClasses = [
    styles.itemButtonBase,
    styles.itemButtonSize[size],
  ].join(" ");

  return (
    <div className={containerClasses}>
      {items.map((item) => {
        const isActive = value === item.id;

        return (
          <button
            key={String(item.id)}
            type="button"
            className={buttonClasses}
            data-active={isActive}
            aria-pressed={isActive}
            onClick={() => onChange(item.id)}
          >
            {isActive && (
              <motion.div
                layoutId={`segmented-slider-${id}`}
                className={styles.slider}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}

            <span className={styles.itemText} data-active={isActive}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export const SegmentedControl = memo(
  SegmentedControlInner,
) as typeof SegmentedControlInner;
