// src/renderer/components/ui/button/basicButton/BasicButton.tsx

import React from "react";
import * as styles from "./basicButton.css";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "danger";
  children: React.ReactNode;
}

const VARIANT_MAP: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: styles.defaultVariant,
  primary: styles.primary,
  danger: styles.danger,
};

export const Button: React.FC<ButtonProps> = React.memo(
  ({ variant = "default", children, className, ...props }) => {
    const variantStyle = VARIANT_MAP[variant] ?? "";
    const combinedClassName =
      `${styles.basicButton} ${variantStyle} ${className ?? ""}`.trim();

    return (
      <button type="button" className={combinedClassName} {...props}>
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

Button;
