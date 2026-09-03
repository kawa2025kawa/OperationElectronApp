import type {
  Tantou,
  TantouDailyDetails,
} from "@shared/types/spreadsheet/tantou";

import { getValue, parseRawToFlatObjects } from "./commonMapper";

function buildDailyDetails(rowObj: Record<string, string>): TantouDailyDetails {
  return {
    hayaban: getValue(rowObj, ["hayaban"]),
    shikai: getValue(rowObj, ["shikai"]),
    uketsuke: getValue(rowObj, ["uketsuke", "uketuke"]),
    denwa: getValue(rowObj, ["denwa"]),
    nimotsu: getValue(rowObj, ["nimotsu"]),
    "2F": getValue(rowObj, ["2F", "floor2F", "floor2f"]),
    "3F": getValue(rowObj, ["3F", "floor3F", "floor3f"]),
    tensou: getValue(rowObj, ["tensou"]),
    amAttendanceRate: getValue(rowObj, ["amAttendanceRate", "amAttendance"]),
    pmAttendanceRate: getValue(rowObj, ["pmAttendanceRate", "pmAttendance"]),
  };
}

export function parseTantouSheet(rawRows: string[][]): Tantou {
  const flatRows = parseRawToFlatObjects(rawRows);

  return {
    id: "tantou_singleton",
    today: buildDailyDetails(flatRows[0] ?? {}),
    tomorrow: buildDailyDetails(flatRows[1] ?? {}),
  };
}
