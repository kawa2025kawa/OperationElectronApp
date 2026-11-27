// src/renderer/components/ui/toggle/SegmentedControl.tsx

import { memo, useMemo } from "react";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";

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

function getItemValue<T extends string | number>(value: T): string {
  return `${typeof value}:${String(value)}`;
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

  const activeIndex = useMemo(
    () => items.findIndex((item) => item.id === value),
    [items, value],
  );

  const selectedItem = activeIndex >= 0 ? items[activeIndex] : undefined;

  const sliderStyle = useMemo(() => {
    const count = items.length;
    if (count === 0 || activeIndex < 0) {
      return { opacity: 0 };
    }

    return {
      width: `${100 / count}%`,
      transform: `translate3d(${activeIndex * 100}%, 0, 0)`,
    };
  }, [items.length, activeIndex]);

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
      aria-label={ariaLabel}
      orientation="horizontal"
    >
      <div className={styles.track}>
        <div className={styles.slider} style={sliderStyle} aria-hidden="true" />

        {items.map((item) => {
          const isActive = value === item.id;

          return (
            <Toggle
              key={getItemValue(item.id)}
              value={getItemValue(item.id)}
              className={buttonClasses}
            >
              <span className={styles.itemText} data-active={isActive}>
                {item.label}
              </span>
            </Toggle>
          );
        })}
      </div>
    </ToggleGroup>
  );
}

export const SegmentedControl = memo(
  SegmentedControlInner,
) as typeof SegmentedControlInner;