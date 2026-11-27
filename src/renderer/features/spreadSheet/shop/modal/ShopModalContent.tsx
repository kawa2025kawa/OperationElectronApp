// src/renderer/features/spreadSheet/shop/modal/ShopModalContent.tsx

import { memo } from "react";
import { ActionButton } from "@renderer/components/ui/button/actionButton/ActionButton";
import { AnimatedTabs } from "@renderer/components/ui/tabs/AnimatedTabs";
import type { GlobalModalComponent } from "@renderer/types/modal";
import type { PublicShop } from "@shared/types/spreadsheet/spreadsheetTypes";
import { useShopModalContent } from "./useShopModalContent";
import * as styles from "./shopModalContent.css";

export interface ShopModalContentProps {
  data: PublicShop;
}

interface ShopTerminalRowProps {
  readonly badge: string;
  readonly cells: readonly { readonly key: string; readonly value: string }[];
}

const ShopTerminalRow = memo(function ShopTerminalRow({
  badge,
  cells,
}: ShopTerminalRowProps) {
  return (
    <div className={styles.terminalRow}>
      <div className={styles.terminalBadge}>{badge}</div>
      <div className={styles.terminalGrid}>
        {cells.map((cell) => (
          <div key={cell.key} className={styles.cellValue}>
            {cell.value}
          </div>
        ))}
      </div>
    </div>
  );
});

interface ShopStandardRowProps {
  readonly label: string;
  readonly value: string;
}

const ShopStandardRow = memo(function ShopStandardRow({
  label,
  value,
}: ShopStandardRowProps) {
  return (
    <div className={styles.terminalRow}>
      <div className={styles.nonTrBadge}>{label}</div>
      <div className={styles.flexCell}>
        <div className={styles.cellValue}>{value}</div>
      </div>
    </div>
  );
});

export const ShopModalContent: GlobalModalComponent<ShopModalContentProps> =
  memo(({ data }) => {
    const {
      selectedIndex,
      setSelectedIndex,
      tabItems,
      displayItems,
      terminalRows,
      trHeaderBadge,
      terminalFields,
      isTimeRecorderTab,
      timeRecorderActions,
    } = useShopModalContent({ data });

    return (
      <AnimatedTabs
        layoutId="shopModalTabSlider"
        tabs={tabItems}
        selectedIndex={selectedIndex}
        onChange={setSelectedIndex}
      >
        {isTimeRecorderTab ? (
          <div className={styles.trTabWrapper}>
            <div className={styles.trTerminalSection}>
              <div className={styles.terminalHeaderRow}>
                <div className={styles.terminalHeaderBadge}>
                  {trHeaderBadge}
                </div>
                <div className={styles.terminalHeaderGrid}>
                  {terminalFields.map(({ label }) => (
                    <div key={label}>{label}</div>
                  ))}
                </div>
              </div>

              <div className={styles.trRowsScrollArea}>
                {terminalRows.map((row) => (
                  <ShopTerminalRow
                    key={row.type}
                    badge={row.badge}
                    cells={row.cells}
                  />
                ))}
              </div>
            </div>

            {timeRecorderActions.length > 0 && (
              <div className={styles.buttonContainer}>
                {timeRecorderActions.map((action) => (
                  <ActionButton
                    key={action.id}
                    variant={action.variant ?? "default"}
                    onClick={action.onClick}
                    disabled={action.disabled}
                  >
                    {action.label}
                  </ActionButton>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.terminalSection}>
            {displayItems.map((item) => (
              <ShopStandardRow
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
          </div>
        )}
      </AnimatedTabs>
    );
  });

ShopModalContent.displayName = "ShopModalContent";