import React, { useEffect } from "react";
import type { OperationItem } from "@shared/types/operationType";
import type { ModalContentProps } from "../../OperationModal";
import { DataTable } from "@renderer/components/ui/table/DataTable";
import type { Column } from "@shared/types/tableType";
import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import * as styles from "./summaryModalContent.css"; // 👈 ここで使用します

interface SummaryModalContentProps extends ModalContentProps {
  items: OperationItem[];
}

const SUMMARY_COLUMNS: Column<OperationItem>[] = [
  { key: "kanriNo", label: "No", width: "15%" },
  { key: "workName", label: "作業名", width: "55%" },
  { key: "jobId", label: "Job ID", width: "15%" },
  {
    key: "status",
    label: "ステータス",
    width: "15%",
    render: (item) => <StatusBadge status={item.status ?? undefined} />,
  },
];

export const SummaryModalContent: React.FC<SummaryModalContentProps> =
  React.memo(({ items, setFooterConfig }) => {
    useEffect(() => {
      setFooterConfig({
        hidePrimary: true,
      });
    }, [setFooterConfig]);

    return (
      // 👇 className に styles.container を指定
      <div className={styles.container}>
        <DataTable data={items} columns={SUMMARY_COLUMNS} rowKey="kanriNo" />
      </div>
    );
  });

SummaryModalContent.displayName = "SummaryModalContent";
export default SummaryModalContent;
