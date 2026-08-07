// src/renderer/components/ui/button/tenpoMaticPdfUpLoadButton/useTenpoMaticPdfUpLoadButton.ts

import type { ButtonHTMLAttributes } from "react";

export interface TenpoMaticPdfUpLoadButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  isExecuting?: boolean;
}

export const useTenpoMaticPdfUpLoadButton = (
  props: TenpoMaticPdfUpLoadButtonProps,
) => {
  const {
    label = "PDF処理",
    isExecuting = false,
    disabled,
    ...buttonProps
  } = props;

  const displayLabel = isExecuting ? "アップロード中..." : label;
  const isDisabled = Boolean(disabled || isExecuting);

  return {
    displayLabel,
    isDisabled,
    buttonProps,
  };
};
