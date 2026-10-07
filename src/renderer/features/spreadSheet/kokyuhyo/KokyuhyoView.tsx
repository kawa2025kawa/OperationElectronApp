// src/renderer/features/spreadSheet/kokyuhyo/KokyuhyoView.tsx

import { memo, useCallback } from "react";
import { format, addDays } from "date-fns";
import { ja } from "date-fns/locale/ja";

import type { Kokyuhyo } from "@shared/types/spreadsheet/kokyuhyo";
import type { Column } from "@shared/types/table/tableType";
import { SHEETS } from "@shared/types/spreadsheet/spreadsheetTypes";
import {
  APP_VIEW_IDS,
  type AppViewDefinition,
} from "@shared/types/registry/viewDefinition";
import { AuthView } from "@renderer/features/auth/AuthView";

import { useSpreadSheetDomainLogic } from "../hooks/useSpreadSheetDomainLogic";
import { KokyuhyoTable } from "./table/KokyuhyoTable";
import { KokyuhyoModalContent } from "./modal/KokyuhyoModalContent";
import * as styles from "./KokyuhyoView.css";

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
export const KOKYUHYO_COLUMNS: readonly Column<Kokyuhyo>[] = [
  { key: "name", label: "氏名", width: "20%" },
  {
    key: "todayAmStatus",
    label: "区分",
    width: "8%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "todayAmDetail",
    label: "午前",
    width: "12%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "todayPmStatus",
    label: "区分",
    width: "8%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "todayPmDetail",
    label: "午後",
    width: "12%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "tomorrowAmStatus",
    label: "区分",
    width: "8%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrowAmDetail",
    label: "午前",
    width: "12%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrowPmStatus",
    label: "区分",
    width: "8%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrowPmDetail",
    label: "午後",
    width: "12%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
] as const;

// --- コンポーネント本体 ---
export const KokyuhyoView = memo(() => {
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

// --- ビュー設定定義 ---
export const kokyuhyoViewConfig: AppViewDefinition<Kokyuhyo> = {
  id: APP_VIEW_IDS.KOKYUHYO,
  title: "公休表",
  component: KokyuhyoView,
  isProtected: true,

  sidebarMenu: {
    show: true,
    order: 2,
  },

  sheetId: SHEETS.KOKYUHYO.sheetName,

  search: {
    placeholder: "名前、名前カナで検索...",
    searchKeys: ["name", "nameKana"],
  },

  columns: KOKYUHYO_COLUMNS,
};
