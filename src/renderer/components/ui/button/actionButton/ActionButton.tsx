// src/renderer/components/ui/button/actionButton/ActionButton.tsx

import React, { type ButtonHTMLAttributes } from "react";
import * as styles from "./actionButton.css";

export type ActionButtonVariant = keyof typeof styles.variants;

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionButtonVariant;
  active?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = React.memo(
  ({
    children,
    variant = "default",
    active,
    type = "button",
    className,
    ...props
  }) => {
    const variantStyle = styles.variants[variant] ?? styles.variants.default;
    const combinedClassName = `${styles.actionButton} ${variantStyle} ${
      className ?? ""
    }`.trim();

    return (
      <button
        type={type}
        className={combinedClassName}
        data-active={active}
        {...props}
      >
        {children}
      </button>
    );
  },
);

ActionButton.displayName = "ActionButton";
