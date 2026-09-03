import type { AppViewDefinition } from "@shared/types/registry";
import { SHEET_IDS, type Tantou } from "@shared/types/spreadsheet";
import type { Column } from "@shared/types/table";
import { APP_VIEW_IDS } from "@shared/types/ui";

export const TANTOU_COLUMNS: readonly Column<Tantou>[] = [
  { key: "today.hayaban", label: "早番", width: "10.5%" },
  { key: "today.shikai", label: "司会", width: "10.5%" },
  { key: "today.uketsuke", label: "受付", width: "10.5%" },
  { key: "today.denwa", label: "電話", width: "10.5%" },
  { key: "today.nimotsu", label: "荷物", width: "10.5%" },
  { key: "today.floor2f", label: "2F", width: "8.5%" },
  { key: "today.floor3f", label: "3F", width: "8.5%" },
  { key: "today.tensou", label: "転送", width: "10.5%" },
  { key: "today.amAttendance", label: "AM出勤率", width: "10%" },
  { key: "today.pmAttendance", label: "PM出勤率", width: "10%" },
] as const;

export const tantouViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.TANTOU,
  title: "Tantou",
  component: null,
  isProtected: true,
  sidebarMenu: { show: false, order: 99 },
  sheetId: SHEET_IDS.TANTOU,
  search: {
    placeholder: "検索...",
    searchKeys: [
      "today.hayaban",
      "today.shikai",
      "today.uketsuke",
      "today.denwa",
      "today.nimotsu",
      "today.floor2f",
      "today.floor3f",
      "today.tensou",
    ],
  },
  modalConfig: {
    modalType: "sheet_tantou",
    modalSize: { width: "70vw", height: "70vh" },
  },
  columns: TANTOU_COLUMNS as readonly Column<unknown>[],
};
