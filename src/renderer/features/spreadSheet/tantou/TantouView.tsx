// src/renderer/features/spreadSheet/tantou/TantouView.tsx

import { memo, useCallback } from "react";
import type { Tantou } from "@shared/types/spreadsheet/tantou";
import type { Column } from "@shared/types/table/tableType";
import { SHEETS } from "@shared/types/spreadsheet/spreadsheetTypes";
import {
  APP_VIEW_IDS,
  type AppViewDefinition,
} from "@shared/types/registry/viewDefinition";
import { AuthView } from "@renderer/features/auth/AuthView";

import { useSpreadSheetDomainLogic } from "../hooks/useSpreadSheetDomainLogic";
import { TantouTable } from "./table/TantouTable";
import { TantouModalContent } from "./modal/TantouModalContent";
import * as styles from "./TantouView.css";

// --- テーブルカラム定義 ---
export const TANTOU_COLUMNS: readonly Column<Tantou>[] = [
  { key: "todayHayaban", label: "早番", width: "10.5%" },
  { key: "todayShikai", label: "司会", width: "10.5%" },
  { key: "todayUketsuke", label: "受付", width: "10.5%" },
  { key: "todayDenwa", label: "電話", width: "10.5%" },
  { key: "todayNimotsu", label: "荷物", width: "10.5%" },
  { key: "todayFloor2", label: "2F", width: "8.5%" },
  { key: "todayFloor3", label: "3F", width: "8.5%" },
  { key: "todayTensou", label: "転送", width: "10.5%" },
  { key: "todayAmAttendanceRate", label: "AM出勤率", width: "10%" },
  { key: "todayPmAttendanceRate", label: "PM出勤率", width: "10%" },
] as const;

// --- コンポーネント本体 ---
export const TantouView = memo(() => {
  const { isAuthenticated, data, openGlobalModal } =
    useSpreadSheetDomainLogic<Tantou>(SHEETS.KOKYUHYO_TANTOU.sheetName);

  const handleRowClick = useCallback(
    (row: Tantou) => {
      openGlobalModal(<TantouModalContent data={row} />, {
        title: "担当詳細",
        width: "70vw",
        height: "70vh",
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
