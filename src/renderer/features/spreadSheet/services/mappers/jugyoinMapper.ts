// src/renderer/features/spreadSheet/services/mappers/jugyoinMapper.ts

import type { Jugyoin } from "@shared/types/spreadsheet/jugyoin";
import { getValue, parseRawToFlatObjects } from "./commonMapper";

export function parseJugyoinSheet(rawRows: string[][]): Jugyoin[] {
  const flatRows = parseRawToFlatObjects(rawRows);

  return flatRows.map((flat, idx) => ({
    id: `jugyoin_row_${flat._rowIdx ?? idx + 1}`,

    bumon: getValue(flat, ["bumon"]),
    name: getValue(flat, ["name"]),

    contact: {
      extension: getValue(flat, ["naisen"]),
      mobileShort: getValue(flat, ["tanshuku"]),
      mobile: getValue(flat, ["contactMobile"]),
    },

    scheduleLink: getValue(flat, ["scheduleLink"]),

    today: {
      date: "",
      amStatus: getValue(flat, ["todayAmStatus"]),
      amDetail: getValue(flat, ["todayAmDetail"]),
      pmStatus: getValue(flat, ["todayPmStatus"]),
      pmDetail: getValue(flat, ["todayPmDetail"]),
    },

    tomorrow: {
      date: "",
      amStatus: getValue(flat, ["tomorrowAmStatus"]),
      amDetail: getValue(flat, ["tomorrowAmDetail"]),
      pmStatus: getValue(flat, ["tomorrowPmStatus"]),
      pmDetail: getValue(flat, ["tomorrowPmDetail"]),
    },
  }));
}
