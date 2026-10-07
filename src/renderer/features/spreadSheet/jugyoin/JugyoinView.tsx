// src/renderer/features/spreadSheet/jugyoin/JugyoinView.tsx

import { addDays, format } from "date-fns";
import { ja } from "date-fns/locale/ja";
import { memo, useCallback } from "react";

import { AuthView } from "@renderer/features/auth/AuthView";
import {
  APP_VIEW_IDS,
  type AppViewDefinition,
} from "@shared/types/registry/viewDefinition";
import type { Jugyoin } from "@shared/types/spreadsheet/jugyoin";
import { SHEETS } from "@shared/types/spreadsheet/spreadsheetTypes";
import type { Column } from "@shared/types/table/tableType";

import { useSpreadSheetDomainLogic } from "../hooks/useSpreadSheetDomainLogic";
import { JugyoinModalContent } from "./modal/JugyoinModalContent";
import * as styles from "./JugyoinView.css";
import { JugyoinTable } from "./table/JugyoinTable";

const getOffsetDate = (offsetDays: number): Date =>
  addDays(new Date(), offsetDays);

const formatDateForHeader = (date: Date): string =>
  format(date, "MM/dd(EEE)", { locale: ja });

const DATE_LABELS = {
  today: `本日 (${formatDateForHeader(new Date())})`,
  tomorrow: `明日 (${formatDateForHeader(getOffsetDate(1))})`,
} as const;

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

export const JugyoinView = memo(() => {
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

JugyoinView.displayName = "JugyoinView";

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

  columns: JUGYOIN_COLUMNS,
};
