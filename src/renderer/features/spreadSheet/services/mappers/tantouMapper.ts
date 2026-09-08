import type {
  Tantou,
  TantouDailyDetails,
} from "@shared/types/spreadsheet/tantou";
import { getValue, parseRawToFlatObjects } from "./commonMapper";

export function parseTantouSheet(rawRows: string[][]): Tantou {
  const rows = parseRawToFlatObjects(rawRows);

  const createDailyDetails = (
    row: Record<string, string> | undefined,
  ): TantouDailyDetails => ({
    hayaban: getValue(row, ["hayaban"]),
    shikai: getValue(row, ["shikai"]),
    uketsuke: getValue(row, ["uketsuke"]),
    denwa: getValue(row, ["denwa"]),
    nimotsu: getValue(row, ["nimotsu"]),
    "2F": getValue(row, ["2F"]),
    "3F": getValue(row, ["3F"]),
    tensou: getValue(row, ["tensou"]),
    amAttendanceRate: getValue(row, ["amAttendanceRate"]),
    pmAttendanceRate: getValue(row, ["pmAttendanceRate"]),
  });

  return {
    id: "tantou",
    today: createDailyDetails(rows[0]),
    tomorrow: createDailyDetails(rows[1]),
  };
}
