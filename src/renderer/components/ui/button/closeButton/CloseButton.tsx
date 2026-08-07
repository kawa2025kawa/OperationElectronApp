// src/renderer/components/ui/button/closeButton/CloseButton.tsx

import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { closeButton } from "./closeButton.css";

export interface CloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost"; // 👈 これを追加
}

export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  (
    {
      className,
      type = "button",
      "aria-label": ariaLabel = "閉じる",
      variant,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={clsx(closeButton, className)}
        aria-label={ariaLabel}
        {...props}
      >
        ✕
      </button>
    );
  },
);

CloseButton.displayName = "CloseButton";
