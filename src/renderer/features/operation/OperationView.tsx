// src/renderer/features/operation/OperationView.tsx

import { memo } from "react";
import { motion } from "motion/react";

import { OperationTable } from "@renderer/features/operation/components/table/OperationTable";

import { useOperationViewLogic } from "./hooks/useOperationViewLogic";
import { OperationModeSwitcher } from "./components/operationModeSwitcher/OperationModeSwitcher";
import { OperationActionMenu } from "./components/operationActionMenu/OperationActionMenu";
import { OperationInfoRow } from "./components/operationInfoRow/OperationInfoRow";
import * as styles from "./operationView.css";

export const OperationView = memo(function OperationView() {
  const {
    currentMode,
    selectedId,
    selectedItem,
    infoRows,
    handleModeChange,
  } = useOperationViewLogic();

  return (
    <div className={styles.container}>
      <div className={styles.tableArea}>
        <div className={styles.tableCard}>
          <OperationTable />
        </div>
      </div>

      <aside className={styles.panelArea}>
        <div className={styles.panelContainer}>
          <div className={styles.topControls}>
            <OperationModeSwitcher
              currentMode={currentMode}
              onModeChange={handleModeChange}
            />

            <OperationActionMenu selectedItem={selectedItem} />
          </div>

          <motion.div
            key={selectedId || "empty"}
            data-operation-info-list="true"
            className={styles.infoList}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
          >
            {infoRows.map((row) => (
              <OperationInfoRow key={row.field} {...row} />
            ))}
          </motion.div>
        </div>
      </aside>
    </div>
  );
});

OperationView.displayName = "OperationView";