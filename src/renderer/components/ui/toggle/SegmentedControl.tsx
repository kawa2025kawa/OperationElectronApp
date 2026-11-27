// src/renderer/components/ui/toggle/SegmentedControl.tsx

import { memo } from "react";
import { Tabs } from "@base-ui/react/tabs";

import * as styles from "./segmentedControl.css";

interface SegmentedControlItem<T extends string | number> {
  readonly id: T;
  readonly label: string;
}

export interface SegmentedControlProps<T extends string | number> {
  /** 識別用プレフィックス */
  readonly id?: string;
  readonly items: readonly SegmentedControlItem<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly size?: "sm" | "md" | "lg";
  readonly fullWidth?: boolean;
  readonly className?: string;
  readonly ariaLabel?: string;
}

function SegmentedControlInner<T extends string | number>({
  items,
  value,
  onChange,
  size = "md",
  fullWidth = true,
  className,
  ariaLabel = "表示モード",
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

  const handleValueChange = (nextValue: T | null) => {
    if (nextValue === null || nextValue === value) return;
    onChange(nextValue);
  };

  return (
    <Tabs.Root
      className={containerClasses}
      value={value}
      onValueChange={handleValueChange}
    >
      <Tabs.List className={styles.track} aria-label={ariaLabel}>
        <Tabs.Indicator className={styles.slider} />

        {items.map((item) => {
          const isActive = value === item.id;

          return (
            <Tabs.Tab
              key={String(item.id)}
              value={item.id}
              className={buttonClasses}
            >
              <span className={styles.itemText} data-active={isActive}>
                {item.label}
              </span>
            </Tabs.Tab>
          );
        })}
      </Tabs.List>
    </Tabs.Root>
  );
}

export const SegmentedControl = memo(
  SegmentedControlInner,
) as typeof SegmentedControlInner;
