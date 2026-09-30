// src/renderer/components/ui/button/closeButton/CloseButton.tsx

import type { ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

import { closeButton } from "./closeButton.css";

export interface CloseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost";
}

export const CloseButton = ({
  className,
  type = "button",
  "aria-label": ariaLabel = "閉じる",
  ...props
}: CloseButtonProps) => {
  return (
    <button
      type={type}
      className={clsx(closeButton, className)}
      aria-label={ariaLabel}
      {...props}
    >
      ×
    </button>
  );
};
