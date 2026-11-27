// src/renderer/components/ui/tooltip/Tooltip.tsx

import { memo, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";

import * as styles from "./tooltip.css";

export const TooltipProvider = BaseTooltip.Provider;

export interface TooltipProps {
  readonly content: ReactNode;
  readonly children: ReactElement<Record<string, unknown>>;
  readonly side?: ComponentProps<typeof BaseTooltip.Positioner>["side"];
  readonly align?: ComponentProps<typeof BaseTooltip.Positioner>["align"];
  readonly sideOffset?: number;
  readonly disabled?: boolean;
}

export const Tooltip = memo(function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  sideOffset = 6,
  disabled = false,
}: TooltipProps) {
  if (disabled || content == null || content === "") {
    return children;
  }

  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner
          className={styles.positioner}
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          <BaseTooltip.Popup className={styles.popup}>
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
});

Tooltip.displayName = "Tooltip";
