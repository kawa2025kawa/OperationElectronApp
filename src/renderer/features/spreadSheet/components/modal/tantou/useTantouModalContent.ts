// src/renderer/features/spreadSheet/components/modal/tantou/useTantouModalContent.ts
import type { AppViewDefinition } from "@renderer/registry/appRegistry";
import type { Column } from "@shared/types/tableType";
import { SHEET_IDS, type Tantou } from "@shared/types/spreadsheetTypes";
import { APP_VIEW_IDS } from "@shared/types/uiType";
import {
  useSpreadSheetTabData,
  type TabGroupConfig,
} from "../hooks/useSpreadSheetTabData";

const TANTOU_COLUMNS: readonly Column<Tantou>[] = [
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
  modalConfig: {
    modalType: "sheet_tantou",
    modalSize: { width: "70vw", height: "70vh" },
  },
  columns: TANTOU_COLUMNS as readonly Column<unknown>[],
};

const TANTOU_FIELDS = [
  { key: "hayaban", label: "早番" },
  { key: "shikai", label: "司会" },
  { key: "uketsuke", label: "受付" },
  { key: "denwa", label: "電話" },
  { key: "nimotsu", label: "荷物" },
  { key: "2F", label: "2F" },
  { key: "3F", label: "3F" },
  { key: "tensou", label: "転送" },
  { key: "amAttendanceRate", label: "AM出勤率" },
  { key: "pmAttendanceRate", label: "PM出勤率" },
] as const;

const createTantouGroup = (
  prefix: "today" | "tomorrow",
  title: string,
): TabGroupConfig => ({
  title,
  items: TANTOU_FIELDS.map(({ key, label }) => ({
    key: `${prefix}.${key}`,
    label,
  })),
});

const TANTOU_MODAL_GROUPS: readonly TabGroupConfig[] = [
  createTantouGroup("today", "本日"),
  createTantouGroup("tomorrow", "明日"),
] as const;

export function useTantouModalContent(data: Tantou) {
  const { selectedIndex, setSelectedIndex, displayItems } =
    useSpreadSheetTabData(
      data as unknown as Record<string, unknown>,
      TANTOU_MODAL_GROUPS,
    );

  return {
    selectedIndex,
    setSelectedIndex,
    displayItems,
  };
}
