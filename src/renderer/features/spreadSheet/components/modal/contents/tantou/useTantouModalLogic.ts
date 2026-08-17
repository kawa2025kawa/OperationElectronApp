import type { Tantou } from "../../../../types/spreadsheetTypes";
import {
  useTabbedModalLogic,
  type TabGroupConfig,
} from "../common/useTabbedModalLogic";

const TANTOU_FIELDS = [
  { key: "hayaban", label: "早番" },
  { key: "shikai", label: "司会" },
  { key: "uketsuke", label: "受付" },
  { key: "denwa", label: "電話" },
  { key: "nimotsu", label: "荷物" },
  { key: "2F", label: "2F担当" },
  { key: "3F", label: "3F担当" },
  { key: "tensou", label: "転送" },
  { key: "amAttendanceRate", label: "AM出勤率" },
  { key: "pmAttendanceRate", label: "PM出勤率" },
];

export const TANTOU_MODAL_GROUPS: readonly TabGroupConfig[] = [
  {
    title: "本日",
    items: TANTOU_FIELDS.map((f) => ({
      key: `today.${f.key}`,
      label: f.label,
    })),
  },
  {
    title: "明日",
    items: TANTOU_FIELDS.map((f) => ({
      key: `tomorrow.${f.key}`,
      label: f.label,
    })),
  },
] as const;

export function useTantouModalLogic(data: Tantou) {
  return useTabbedModalLogic(
    data as unknown as Record<string, unknown>,
    TANTOU_MODAL_GROUPS,
  );
}
