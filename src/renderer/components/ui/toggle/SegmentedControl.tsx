// src/renderer/components/ui/toggle/SegmentedControl.tsx

import { memo } from "react";
import { motion } from "motion/react";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";

import * as styles from "./segmentedControl.css";

interface SegmentedControlItem<T extends string | number> {
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

function getItemValue<T extends string | number>(value: T): string {
  return `${typeof value}:${String(value)}`;
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

  const selectedItem = items.find((item) => item.id === value);

  const handleValueChange = (groupValue: string[]) => {
    const selectedValue = groupValue[0];

    if (selectedValue === undefined) return;

    const selected = items.find(
      (item) => getItemValue(item.id) === selectedValue,
    );

    if (selected) {
      onChange(selected.id);
    }
  };

  return (
    <ToggleGroup
      className={containerClasses}
      value={selectedItem ? [getItemValue(selectedItem.id)] : []}
      onValueChange={handleValueChange}
      aria-label="表示モード"
      orientation="horizontal"
    >
      {items.map((item) => {
        const isActive = value === item.id;

        return (
          <Toggle
            key={getItemValue(item.id)}
            value={getItemValue(item.id)}
            className={buttonClasses}
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
          </Toggle>
        );
      })}
    </ToggleGroup>
  );
}

export const SegmentedControl = memo(
  SegmentedControlInner,
) as typeof SegmentedControlInner;
