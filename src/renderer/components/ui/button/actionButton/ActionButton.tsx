// src/renderer/components/ui/button/actionButton/ActionButton.tsx

import { memo, type ButtonHTMLAttributes } from "react";
import * as styles from "./actionButton.css";

// export を外してファイル内限定に（Knip 警告解消）
type ActionButtonVariant = keyof typeof styles.variants;

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionButtonVariant;
  active?: boolean;
}

export const ActionButton = memo(function ActionButton({
  children,
  variant = "default",
  active,
  type = "button",
  className,
  ...props
}: ActionButtonProps) {
  const variantStyle = styles.variants[variant] ?? styles.variants.default;
  const combinedClassName = [styles.actionButton, variantStyle, className]
    .filter(Boolean)
    .join(" ");

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
});
