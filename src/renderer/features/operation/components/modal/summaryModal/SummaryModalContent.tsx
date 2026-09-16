// src/renderer/features/operation/components/modal/summaryModal/SummaryModalContent.tsx

import React from "react";
import { DataTable } from "@renderer/components/ui/table/DataTable";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { OperationItem } from "@shared/types/operation";
import { useSummaryModalContent } from "./useSummaryModalContent";
import * as styles from "./summaryModalContent.css";

interface SummaryModalContentProps {
  items: OperationItem[];
}

export const SummaryModalContent: GlobalModalComponent<SummaryModalContentProps> =
  React.memo(({ items }) => {
    const { state } = useSummaryModalContent(items);

    return (
      <div className={styles.container}>
        <DataTable
          data={state.items}
          columns={state.columns}
          rowKey="kanriNo"
        />
      </div>
    );
  });

SummaryModalContent.modalSize = {
  width: "min(90vw, 1000px)",
  height: "min(75vh, 600px)",
};

SummaryModalContent.displayName = "SummaryModalContent";
