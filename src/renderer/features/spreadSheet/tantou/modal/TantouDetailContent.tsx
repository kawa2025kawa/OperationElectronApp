// src/renderer/features/spreadSheet/tantou/modal/TantouDetailContent.tsx

import { memo } from "react";
import { AnimatedTabs } from "@renderer/components/ui/tabs/AnimatedTabs";
import type { GlobalModalComponent } from "@renderer/types/modal";
import type { Tantou } from "@shared/types/spreadsheet/spreadsheetTypes";
import { useTantouDetailContent } from "./useTantouDetailContent";
import * as styles from "./tantouDetailContent.css";

export interface TantouDetailContentProps {
  data: Tantou;
}

interface TantouDetailRowProps {
  label: string;
  value: string;
}

const TantouDetailRow = memo(function TantouDetailRow({
  label,
  value,
}: TantouDetailRowProps) {
  return (
    <div className={styles.detailRow}>
      <div className={styles.fieldLabel}>{label}</div>
      <div className={styles.fieldValueContainer}>
        <div className={styles.fieldValue}>{value}</div>
      </div>
    </div>
  );
});

export const TantouDetailContent: GlobalModalComponent<TantouDetailContentProps> =
  memo(({ data }) => {
    const { selectedIndex, setSelectedIndex, tabs, displayItems } =
      useTantouDetailContent(data);

    return (
      <AnimatedTabs
        layoutId="tantouDetailTabSlider"
        tabs={tabs}
        selectedIndex={selectedIndex}
        onChange={setSelectedIndex}
      >
        <div className={styles.detailList}>
          {displayItems.map(({ label, value }) => (
            <TantouDetailRow key={label} label={label} value={value} />
          ))}
        </div>
      </AnimatedTabs>
    );
  });

TantouDetailContent.displayName = "TantouDetailContent";