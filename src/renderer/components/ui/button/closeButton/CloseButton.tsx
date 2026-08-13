// src/renderer/components/ui/button/closeButton/CloseButton.tsx

import React from "react";
import { clsx } from "clsx";
import { closeButton } from "./closeButton.css";

export interface CloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost";
  ref?: React.Ref<HTMLButtonElement>;
}

export const CloseButton: React.FC<CloseButtonProps> = ({
  className,
  type = "button",
  "aria-label": ariaLabel = "閉じる",
  ref,
  ...props
}) => {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(closeButton, className)}
      aria-label={ariaLabel}
      {...props}
    >
      ×
    </button>
  );
};

CloseButton.displayName = "CloseButton";
export default CloseButton;
