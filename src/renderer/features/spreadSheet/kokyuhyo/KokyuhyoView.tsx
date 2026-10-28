// src/renderer/features/spreadSheet/kokyuhyo/KokyuhyoView.tsx

import { memo, useCallback } from "react";
import type { Kokyuhyo } from "@shared/types/spreadsheet/kokyuhyo";
import { SHEETS } from "@shared/types/spreadsheet/spreadsheetTypes";
import { AuthView } from "@renderer/features/auth/AuthView";

import { useSpreadSheetDomainLogic } from "../hooks/useSpreadSheetDomainLogic";
import { KokyuhyoTable } from "./table/KokyuhyoTable";
import { KokyuhyoModalContent } from "./modal/KokyuhyoModalContent";
import * as styles from "./spreadSheetView.css";

export const KokyuhyoView = memo(function KokyuhyoView() {
  const { isAuthenticated, data, openGlobalModal } =
    useSpreadSheetDomainLogic<Kokyuhyo>(SHEETS.KOKYUHYO.sheetName);

  const handleRowClick = useCallback(
    (row: Kokyuhyo) => {
      const title = row.name || "";

      openGlobalModal(<KokyuhyoModalContent data={row} />, {
        title,
        width: "90vw",
        height: "85vh",
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
          <KokyuhyoTable rows={data} onRowClick={handleRowClick} />
        </div>
      </div>
    </div>
  );
});

KokyuhyoView.displayName = "KokyuhyoView";
