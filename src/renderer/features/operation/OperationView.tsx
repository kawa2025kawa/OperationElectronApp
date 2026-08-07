// src/renderer/features/operation/OperationView.tsx
import React from "react";
import { UnifiedTable } from "@renderer/features/operation/components/table/OperationTable";
import { InfoPanel } from "@renderer/features/operation/components/infoPanel/InfoPanel";
import { ButtonPanel } from "@renderer/features/operation/components/buttonPanel/ButtonPanel";
import * as styles from "./operationView.css";

export const OperationView: React.FC = React.memo(() => {
  return (
    <div className={styles.container}>
      <div className={styles.tableArea}>
        <div className={styles.tableCard}>
          <UnifiedTable />
        </div>
      </div>
      <aside className={styles.panelArea}>
        <div className={styles.panelContainer}>
          <ButtonPanel />
          <InfoPanel />
        </div>
      </aside>
    </div>
  );
});

OperationView.displayName = "OperationView";
export default OperationView;
