import React, { useMemo } from "react";
import clsx from "clsx";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@shared/store";
import { getStatusLabel } from "@shared/types/uiType";
import { formatToJapaneseDateTime } from "@shared/utils/dateUtils";
import { selectActiveItemStatusFlags } from "@renderer/features/operation/store/operationSelectors";
import * as styles from "./InfoPanel.css";

type InfoRowProps = {
  label: string;
  value: string | number | null | undefined;
};

const InfoRow = React.memo(({ label, value }: InfoRowProps) => {
  const variant = label === "備考" ? "remarks" : "standard";
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

  const infoRows = useMemo(
    () => [
      { label: "管理 No", value: selectedItem?.kanriNo },
      { label: "作業名", value: selectedItem?.workName },
      { label: "状態", value: getStatusLabel(status) },
      {
        label: "開始時刻",
        value: formatToJapaneseDateTime(selectedItem?.startTime),
      },
      {
        label: "終了時刻",
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
      { label: "備考", value: selectedItem?.comment },
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
