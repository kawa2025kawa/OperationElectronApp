// electron/features/rdp/rdpMasterService.ts

import { authService } from "@electron/features/auth/authIpc";
import { loadCache, saveCache } from "@electron/shared/cache/fileCache";

import {
  SHEETS,
  type RdpMaster,
} from "@shared/types/spreadsheet/spreadsheetTypes";

const CACHE_FILE_NAME = "rdpMaster.cache.json";

interface RdpMasterCache {
  data: RdpMaster[];
}

let currentData: RdpMaster[] = [];
let initialized = false;

function loadRdpMasterCache(): RdpMasterCache | null {
  const cache = loadCache<unknown>(CACHE_FILE_NAME);

  if (!isRdpMasterCache(cache)) {
    return null;
  }

  return cache;
}

function saveRdpMasterCache(data: RdpMaster[]): void {
  saveCache<RdpMasterCache>(CACHE_FILE_NAME, {
    data,
  });
}

export async function loadRdpMasters(): Promise<RdpMaster[]> {
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/` +
    `${encodeURIComponent(SHEETS.RDP.spreadsheetId)}/values/` +
    `${encodeURIComponent(`'${SHEETS.RDP.sheetName.replace(/'/g, "''")}'`)}`;

  try {
    const response = await authService.request(url);
    const responseText = await response.text();

    if (!response.ok) {
      console.error("[rdpMasterService] Failed to fetch RDP Master", {
        status: response.status,
        errorText: responseText,
      });

      return getRdpMasters();
    }

    let json: {
      values?: string[][];
    };

    try {
      json = JSON.parse(responseText) as {
        values?: string[][];
      };
    } catch (error) {
      console.error("[rdpMasterService] Invalid Google Sheets response", error);

      return getRdpMasters();
    }

    currentData = parseSheetRows<RdpMaster>(json.values ?? []);
    initialized = true;

    saveRdpMasterCache(currentData);

    return currentData;
  } catch (error) {
    console.error("[rdpMasterService] Failed to fetch RDP Master", error);

    return getRdpMasters();
  }
}

function getRdpMasters(): RdpMaster[] {
  if (!initialized) {
    const cache = loadRdpMasterCache();

    currentData = cache?.data ?? [];
    initialized = true;
  }

  return currentData;
}

export function getRdpMaster(name: string): RdpMaster | undefined {
  return getRdpMasters().find((item) => item.name === name);
}

function parseSheetRows<T>(rows: string[][]): T[] {
  if (rows.length <= 1) {
    return [];
  }

  const [headers, ...dataRows] = rows;

  return dataRows
    .filter((row) => row.some((value) => value !== ""))
    .map((row) => {
      const item: Record<string, string> = {};

      headers.forEach((header, index) => {
        if (header === "") {
          return;
        }

        item[header] = row[index] ?? "";
      });

      return item as T;
    });
}

function isRdpMasterCache(value: unknown): value is RdpMasterCache {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return Array.isArray(data.data);
}
