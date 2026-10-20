// src/renderer/features/spreadsheet/tantou/table/TantouTable.tsx

import { memo } from "react";
import type { Tantou } from "@shared/types/spreadsheet/tantou";
import type { Column } from "@shared/types/table/tableType";
import { SpreadSheetBaseTable } from "../../components/table/SpreadSheetBaseTable";
import * as styles from "@renderer/styles/global/table.css"; // 🎯 正しい import に修正

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

export interface TantouTableProps {
  rows: readonly Tantou[];
  selectedId?: string;
  onRowClick?: (item: Tantou) => void;
}

export const TantouTable = memo(
  ({ rows, selectedId, onRowClick }: TantouTableProps) => {
    return (
      <SpreadSheetBaseTable
        rows={rows}
        columns={TANTOU_COLUMNS}
        selectedId={selectedId}
        getRowId={(_row, index) => String(index)}
        onRowClick={onRowClick}
        styles={styles}
      />
    );
  },
);

TantouTable.displayName = "TantouTable";
