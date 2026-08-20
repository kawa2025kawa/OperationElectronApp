// src/renderer/features/spreadSheet/components/modal/contents/tantou/TantouModalContent.tsx
import React from "react";
import type { Tantou } from "@shared/types/spreadsheetTypes";
import {
  SpreadSheetModal,
  type TabGroupConfig,
} from "@renderer/features/spreadSheet/components/modal/SpreadSheetModal";

const TANTOU_FIELDS = [
  { key: "hayaban", label: "早番" },
  { key: "shikai", label: "司会" },
  { key: "uketsuke", label: "受付" },
  { key: "denwa", label: "電話" },
  { key: "nimotsu", label: "荷物" },
  { key: "2F", label: "2F" },
  { key: "3F", label: "3F" },
  { key: "tensou", label: "転送" },
  { key: "amAttendanceRate", label: "AM出社率" },
  { key: "pmAttendanceRate", label: "PM出社率" },
];

const TANTOU_MODAL_GROUPS: readonly TabGroupConfig[] = [
  {
    title: "今日",
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

export const TantouModalContent: React.FC<{
  data: Tantou;
  title: string;
  onClose: () => void;
}> = React.memo(({ data, title, onClose }) => (
  <SpreadSheetModal
    title={title}
    onClose={onClose}
    data={data as unknown as Record<string, unknown>}
    groupConfigs={TANTOU_MODAL_GROUPS}
  />
));
TantouModalContent.displayName = "TantouModalContent";
export default TantouModalContent;
