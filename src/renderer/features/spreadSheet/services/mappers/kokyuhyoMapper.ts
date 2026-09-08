// src/renderer/features/spreadSheet/services/mappers/kokyuhyoMapper.ts

import type { Kokyuhyo } from "@shared/types/spreadsheet/kokyuhyo";
import { getValue, parseRawToFlatObjects } from "./commonMapper";

export function parseKokyuhyoSheet(rawRows: string[][]): Kokyuhyo[] {
  const rows = parseRawToFlatObjects(rawRows);

  return rows.map((row, index) => ({
    id: `kokyuhyo_row_${row._rowIdx ?? index + 1}`,

    name: getValue(row, ["name"]),

    contact: {
      extension: getValue(row, ["naisen"]),
      mobileShort: getValue(row, ["tanshuku"]),
      mobile: getValue(row, ["contactMobile"]),
    },

    scheduleLink: getValue(row, ["scheduleLink"]),

    today: {
      date: "",
      amStatus: getValue(row, ["todayAmStatus"]),
      amDetail: getValue(row, ["todayAmDetail"]),
      pmStatus: getValue(row, ["todayPmStatus"]),
      pmDetail: getValue(row, ["todayPmDetail"]),
    },

    tomorrow: {
      date: "",
      amStatus: getValue(row, ["tomorrowAmStatus"]),
      amDetail: getValue(row, ["tomorrowAmDetail"]),
      pmStatus: getValue(row, ["tomorrowPmStatus"]),
      pmDetail: getValue(row, ["tomorrowPmDetail"]),
    },
  }));
}
