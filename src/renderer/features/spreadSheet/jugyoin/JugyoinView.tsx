// src/renderer/features/spreadSheet/jugyoin/JugyoinView.tsx

import { memo, useCallback } from "react";
import { AuthView } from "@renderer/features/auth/AuthView";
import type { Jugyoin } from "@shared/types/spreadsheet/jugyoin";
import { SHEETS } from "@shared/types/spreadsheet/spreadsheetTypes";

import { useSpreadSheetDomainLogic } from "../hooks/useSpreadSheetDomainLogic";
import { JugyoinModalContent } from "./modal/JugyoinModalContent";
import { JugyoinTable } from "./table/JugyoinTable";
import * as styles from "../kokyuhyo/spreadSheetView.css";

export const JugyoinView = memo(function JugyoinView() {
  const { isAuthenticated, data, openGlobalModal } =
    useSpreadSheetDomainLogic<Jugyoin>(SHEETS.JUGYOIN.sheetName);

  const handleRowClick = useCallback(
    (row: Jugyoin) => {
      openGlobalModal(<JugyoinModalContent data={row} />, {
        title: row.name || "",
        width: "min(95vw, calc(75vh * (21 / 9)))",
        height: "min(75vh, calc(95vw * (9 / 21)))",
      });
    },
    [openGlobalModal],
  );

  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <div className={styles.viewContainer}>
      <div className={styles.inner}>
        <div className={styles.tableArea}>
          <JugyoinTable rows={data} onRowClick={handleRowClick} />
        </div>
      </div>
    </div>
  );
});
