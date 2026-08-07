// src/renderer/features/operation/components/infoPanel/InfoPanel.tsx
import React, { useMemo } from "react";
import { clsx } from "clsx";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@shared/store/index";
import { formatToJapaneseDateTime } from "@shared/utils/dateUtils";
import { selectActiveItemStatusFlags } from "@shared/store/selectors/operationSelectors";
import { getStatusLabel } from "@shared/types/uiType";
import * as styles from "./InfoPanel.css";

type InfoRowProps = {
  label: string;
  value: string | number | null | undefined;
};

const InfoRow = React.memo(({ label, value }: InfoRowProps) => {
  // 「コメント」や「備考」など、複数行になる可能性がある項目を判定
  const variant = label === "コメント" ? "remarks" : "standard";
  return (
    <div className={clsx(styles.row, styles.rowVariants[variant])}>
      <span className={styles.infoLabel}>{label}</span>
      <span
        className={clsx(
          styles.resultvalue,
          styles.detailValueVariants[variant],
        )}
      >
        {value || "-"}
      </span>
    </div>
  );
});
InfoRow.displayName = "InfoRow";

const InfoPanelComponent: React.FC = () => {
  const { selectedItem, status } = useAppStore(
    useShallow((s) => {
      const flags = selectActiveItemStatusFlags(s);
      return {
        selectedItem: flags.item,
        status: flags.status,
      };
    }),
  );

  // 表示する項目を配列として定義
  const infoRows = useMemo(
    () => [
      { label: "管理No", value: selectedItem?.kanriNo },
      { label: "ジョブ名", value: selectedItem?.workName },
      { label: "ステータス", value: getStatusLabel(status) },
      {
        label: "開始日時",
        value: formatToJapaneseDateTime(selectedItem?.startTime),
      },
      {
        label: "終了日時",
        value: formatToJapaneseDateTime(selectedItem?.endTime),
      },
      {
        label: "予定開始",
        value: formatToJapaneseDateTime(selectedItem?.expectedStartTime),
      },
      {
        label: "予定終了",
        value: formatToJapaneseDateTime(selectedItem?.expectedEndTime),
      },
      {
        label: "サブステータス",
        value: selectedItem?.substatus?.length
          ? selectedItem.substatus.join(", ")
          : "-",
      },
      { label: "コメント", value: selectedItem?.comment },
    ],
    [selectedItem, status],
  );

  return (
    <div className={styles.infoContainer}>
      <div className={styles.infolsList}>
        {infoRows.map((row) => (
          <InfoRow key={row.label} label={row.label} value={row.value} />
        ))}
      </div>
    </div>
  );
};

export const InfoPanel = React.memo(InfoPanelComponent);
InfoPanel.displayName = "InfoPanel";
export default InfoPanel;
