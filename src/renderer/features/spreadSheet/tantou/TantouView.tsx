import { memo, useCallback } from "react";
import type { Tantou } from "@shared/types/spreadsheet/tantou";
import { SHEETS } from "@shared/types/spreadsheet/spreadsheetTypes";
import {
  APP_VIEW_IDS,
  type AppViewDefinition,
} from "@shared/types/registry/viewDefinition";
import { AuthView } from "@renderer/features/auth/AuthView";

import { useSpreadSheetDomainLogic } from "../hooks/useSpreadSheetDomainLogic";
import { TANTOU_COLUMNS, TantouTable } from "./table/TantouTable";
import { TantouModalContent } from "./modal/TantouModalContent";
import * as styles from "./TantouView.css";

// --- コンポーネント本体 ---
const TantouView = memo(() => {
  const { isAuthenticated, data, openGlobalModal } =
    useSpreadSheetDomainLogic<Tantou>(SHEETS.KOKYUHYO_TANTOU.sheetName);

  const handleRowClick = useCallback(
    (row: Tantou) => {
      openGlobalModal(<TantouModalContent data={row} />, {
        title: "担当詳細",
        width: "min(90vw, 800px)",
        height: "min(80vh, 600px)",
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
          <TantouTable rows={data} onRowClick={handleRowClick} />
        </div>
      </div>
    </div>
  );
});

TantouView.displayName = "TantouView";

// --- ビュー設定定義 ---
export const tantouViewConfig: AppViewDefinition<Tantou> = {
  id: APP_VIEW_IDS.TANTOU,
  title: "担当表",
  component: TantouView,
  isProtected: true,

  sidebarMenu: {
    show: false,
    order: 99,
  },

  sheetId: SHEETS.KOKYUHYO_TANTOU.sheetName,

  search: {
    placeholder: "担当名で検索...",
    searchKeys: [
      "todayHayaban",
      "todayShikai",
      "todayUketsuke",
      "todayDenwa",
      "todayNimotsu",
      "todayFloor2",
      "todayFloor3",
      "todayTensou",
    ],
  },

  columns: TANTOU_COLUMNS,
};
