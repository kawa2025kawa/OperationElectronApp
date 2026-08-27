import React from "react";
import { DataTable } from "@renderer/components/ui/table/DataTable";
import type { OperationItem } from "@shared/types/operationType";
import { SUMMARY_COLUMNS } from "./types";
import { useSummaryModalContent } from "./useSummaryModalContent";
import { useOperationModalContext } from "../OperationModalContext";
import * as styles from "./summaryModalContent.css";

interface SummaryModalContentProps {
  items: OperationItem[];
  title?: string;
}

export const SummaryModalContent: React.FC<SummaryModalContentProps> =
  React.memo(({ items, title }) => {
    const { setTitle } = useOperationModalContext();
    const { displayItems } = useSummaryModalContent({ items, title, setTitle });

    return (
      <div className={styles.container}>
        <DataTable
          data={displayItems}
          columns={SUMMARY_COLUMNS}
          rowKey="kanriNo"
        />
      </div>
    );
  });

SummaryModalContent.displayName = "SummaryModalContent";

SummaryModalContent;
