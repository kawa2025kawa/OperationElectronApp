// src/renderer/features/spreadSheet/jugyoin/JugyoinView.tsx

import { memo, useCallback } from "react";
import { format, addDays } from "date-fns";
import { ja } from "date-fns/locale/ja";

import type { Jugyoin } from "@shared/types/spreadsheet/jugyoin";
import type { Column } from "@shared/types/table/tableType";
import { SHEETS } from "@shared/types/spreadsheet/spreadsheetTypes";
import {
  APP_VIEW_IDS,
  type AppViewDefinition,
} from "@shared/types/registry/viewDefinition";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { LoadingOverlay } from "@renderer/components/ui/overlay/LoadingOverlay";
import { AuthView } from "@renderer/features/auth/AuthView";

import { useSpreadSheetDomainLogic } from "../hooks/useSpreadSheetDomainLogic";
import { JugyoinTable } from "./table/JugyoinTable";
import { JugyoinModalContent } from "./modal/JugyoinModalContent";
import * as styles from "./JugyoinView.css";

// --- 日付計算ヘルパー ---
const getOffsetDate = (offsetDays: number): Date =>
  addDays(new Date(), offsetDays);

const formatDateForHeader = (date: Date): string =>
  format(date, "MM/dd(EEE)", { locale: ja });

const DATE_LABELS = {
  today: `本日 (${formatDateForHeader(new Date())})`,
  tomorrow: `明日 (${formatDateForHeader(getOffsetDate(1))})`,
} as const;

// --- テーブルカラム定義 ---
export const JUGYOIN_COLUMNS: readonly Column<Jugyoin>[] = [
  { key: "bumon", label: "部門", width: "15%" },
  { key: "name", label: "氏名", width: "15%" },
  {
    key: "todayAmStatus",
    label: "区分",
    width: "7%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "todayAmDetail",
    label: "午前",
    width: "10.5%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "todayPmStatus",
    label: "区分",
    width: "7%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "todayPmDetail",
    label: "午後",
    width: "10.5%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "tomorrowAmStatus",
    label: "区分",
    width: "7%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrowAmDetail",
    label: "午前",
    width: "10.5%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrowPmStatus",
    label: "区分",
    width: "7%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrowPmDetail",
    label: "午後",
    width: "10.5%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
] as const;

// --- コンポーネント本体 ---
export const JugyoinView = memo(() => {
  const {
    isAuthenticated,
    data,
    isFetching,
    error,
    handleRetry,
    loadingMessage,
    openGlobalModal,
  } = useSpreadSheetDomainLogic<Jugyoin>(SHEETS.JUGYOIN.sheetName);

  const handleRowClick = useCallback(
    (row: Jugyoin) => {
      const title = row.name || "";
      openGlobalModal(() => <JugyoinModalContent data={row} />, { title });
    },
    [openGlobalModal],
  );

  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <>
      <LoadingOverlay isOpen={isFetching} message={loadingMessage} />
      <div className={styles.viewContainer}>
        <div className={styles.inner}>
          {error && data.length === 0 && !isFetching ? (
            <EmptyState message={error} onRetry={handleRetry} />
          ) : (
            <div className={styles.tableArea}>
              <JugyoinTable rows={data} onRowClick={handleRowClick} />
            </div>
          )}
        </div>
      </div>
    </>
  );
});

JugyoinView.displayName = "JugyoinView";

// --- ビュー設定定義 ---
export const jugyoinViewConfig: AppViewDefinition<Jugyoin> = {
  id: APP_VIEW_IDS.JUGYOIN,
  title: "従業員情報",
  component: JugyoinView,
  isProtected: true,

  sidebarMenu: {
    show: true,
    order: 3,
  },

  sheetId: SHEETS.JUGYOIN.sheetName,

  search: {
    placeholder: "部門、名前で検索...",
    searchKeys: ["bumon", "bumonKana", "name", "nameKana"],
  },

  modalConfig: {
    modalType: "sheet_jugyoin",
    modalSize: {
      width: "90vw",
      height: "85vh",
    },
  },

  columns: JUGYOIN_COLUMNS,
};
