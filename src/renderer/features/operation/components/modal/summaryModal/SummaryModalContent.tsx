// src/renderer/features/operation/components/modal/summaryModal/SummaryModalContent.tsx

import React, { useEffect } from "react";
import { ActionButton } from "@renderer/components/ui/button/actionButton/ActionButton";
import { DataTable } from "@renderer/components/ui/table/DataTable";
import { useAppStore } from "@renderer/store";
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
    const updateModalConfig = useAppStore((s) => s.updateModalConfig);
    const closeModal = useAppStore((s) => s.closeGlobalModal);

    // 🎯 フッター領域へ「閉じる」ボタン単体を注入
    useEffect(() => {
      updateModalConfig({
        footerContent: (
          <ActionButton variant="default" onClick={closeModal}>
            閉じる
          </ActionButton>
        ),
      });
    }, [updateModalConfig, closeModal]);

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

// 🎯 横長で一覧しやすいサイズを静的指定
SummaryModalContent.modalSize = {
  width: "min(90vw, 1000px)",
  height: "min(75vh, 600px)",
};

SummaryModalContent.displayName = "SummaryModalContent";
