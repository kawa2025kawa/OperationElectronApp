// src/renderer/features/operation/OperationView.tsx

import React from "react";
import { SidePanel } from "@renderer/features/operation/components/sidePanel/SidePanel";
import { UnifiedTable } from "@renderer/features/operation/components/table/OperationTable";
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
        <SidePanel />
      </aside>
    </div>
  );
});

OperationView.displayName = "OperationView";

OperationView;
