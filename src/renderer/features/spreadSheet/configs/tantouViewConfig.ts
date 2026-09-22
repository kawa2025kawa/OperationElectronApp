// src/renderer/features/spreadSheet/configs/tantouViewConfig.ts

import type { Tantou } from "@shared/types/spreadsheet/tantou";
import type { Column } from "@shared/types/table/tableType";
import {
  APP_VIEW_IDS,
  type AppViewDefinition,
} from "@shared/types/registry/viewDefinition";

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

export const tantouViewConfig: AppViewDefinition<Tantou> = {
  id: APP_VIEW_IDS.TANTOU,
  title: "Tantou",
  component: null,
  isProtected: true,
  sidebarMenu: { show: false, order: 99 },
  sheetId: "KokyuhyoTantouMasterData",
  search: {
    placeholder: "検索...",
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
  modalConfig: {
    modalType: "sheet_tantou",
    modalSize: { width: "70vw", height: "70vh" },
  },
  columns: TANTOU_COLUMNS,
};
