import type { Kokyuhyo } from "@shared/types/spreadsheet/kokyuhyo";

import { EMPTY_VALUE, parseRawToFlatObjects } from "./commonMapper";

export function parseKokyuhyoSheet(
  rawRows: string[][],
  keyMap?: Record<string, string>,
): Kokyuhyo[] {
  const flatRows = parseRawToFlatObjects(rawRows, keyMap);

  return flatRows.map((flat, idx) => {
    const name = flat.name || EMPTY_VALUE;
    const fallbackId = `kokyuhyo_row_${flat._rowIdx || idx + 1}`;

    return {
      id: flat.id || fallbackId,
      name,
      baseDetail: flat.baseDetail || EMPTY_VALUE,
      contact: {
        extension: flat.naisen || flat["contact.extension"] || EMPTY_VALUE,
        mobileShort:
          flat.tanshuku || flat["contact.mobileShort"] || EMPTY_VALUE,
        mobile: flat.contactMobile || flat["contact.mobile"] || EMPTY_VALUE,
      },
      scheduleLink: flat.scheduleLink || EMPTY_VALUE,
      today: {
        date: flat["today.date"] || EMPTY_VALUE,
        amStatus: flat.todayAmStatus || flat["today.amStatus"] || EMPTY_VALUE,
        amDetail: flat.todayAmDetail || flat["today.amDetail"] || EMPTY_VALUE,
        pmStatus: flat.todayPmStatus || flat["today.pmStatus"] || EMPTY_VALUE,
        pmDetail: flat.todayPmDetail || flat["today.pmDetail"] || EMPTY_VALUE,
      },
      tomorrow: {
        date: flat["tomorrow.date"] || EMPTY_VALUE,
        amStatus:
          flat.tomorrowAmStatus ||
          flat.AM2 ||
          flat["tomorrow.amStatus"] ||
          EMPTY_VALUE,
        amDetail:
          flat.tomorrowAmDetail ||
          flat["AM2.detail"] ||
          flat["tomorrow.amDetail"] ||
          EMPTY_VALUE,
        pmStatus:
          flat.tomorrowPmStatus ||
          flat.PM2 ||
          flat["tomorrow.pmStatus"] ||
          EMPTY_VALUE,
        pmDetail:
          flat.tomorrowPmDetail ||
          flat["PM2.detail"] ||
          flat["tomorrow.pmDetail"] ||
          EMPTY_VALUE,
      },
    };
  });
}
