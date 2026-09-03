import type { Jugyoin } from "@shared/types/spreadsheet/jugyoin";
import { EMPTY_VALUE, getValue, parseRawToFlatObjects } from "./commonMapper";

export function parseJugyoinSheet(
  rawRows: string[][],
  keyMap?: Record<string, string>,
): Jugyoin[] {
  const flatRows = parseRawToFlatObjects(rawRows, keyMap);

  return flatRows.map((flat, idx) => {
    const fallbackId = `jugyoin_row_${flat._rowIdx || idx + 1}`;

    return {
      id: getValue(flat, ["id"], fallbackId),
      department: getValue(flat, ["bumon", "department"]),
      name: getValue(flat, ["name"]),
      baseDetail: getValue(flat, ["baseDetail"]),
      contact: {
        extension: getValue(flat, ["naisen", "contact.extension"]),
        mobileShort: getValue(flat, ["tanshuku", "contact.mobileShort"]),
        mobile: getValue(flat, ["contactMobile", "contact.mobile"]),
      },
      scheduleLink: getValue(flat, ["scheduleLink"]),
      today: {
        date: getValue(flat, ["today.date"]),
        amStatus: getValue(flat, ["todayAmStatus", "today.amStatus"]),
        amDetail: getValue(flat, ["todayAmDetail", "today.amDetail"]),
        pmStatus: getValue(flat, ["todayPmStatus", "today.pmStatus"]),
        pmDetail: getValue(flat, ["todayPmDetail", "today.pmDetail"]),
      },
      tomorrow: {
        date: getValue(flat, ["tomorrow.date"]),
        amStatus: getValue(flat, [
          "tomorrowAmStatus",
          "AM2",
          "tomorrow.amStatus",
        ]),
        amDetail: getValue(flat, [
          "tomorrowAmDetail",
          "AM2.detail",
          "tomorrow.amDetail",
        ]),
        pmStatus: getValue(flat, [
          "tomorrowPmStatus",
          "PM2",
          "tomorrow.pmStatus",
        ]),
        pmDetail: getValue(flat, [
          "tomorrowPmDetail",
          "PM2.detail",
          "tomorrow.pmDetail",
        ]),
      },
    };
  });
}
