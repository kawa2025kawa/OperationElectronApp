// src/renderer/components/ui/fileDropZone/fileDropZoneTypes.ts

export const ORDER_TIME_OPTIONS = [
  { value: "1", timeLabel: "09時20分" },
  { value: "2", timeLabel: "11時00分" },
  { value: "3", timeLabel: "13時00分" },
  { value: "4", timeLabel: "14時20分" },
  { value: "5", timeLabel: "16時00分" },
] as const;

export interface FileDropZoneItem {
  name: string;
  path: string;
}
