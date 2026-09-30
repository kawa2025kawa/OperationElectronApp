// electron/features/spreadsheet/spreadsheetIpc.ts

import { ipcMain } from "electron";
import { authService } from "@electron/features/auth/authIpc";
import {
  normalizeSheetData,
  type FetchSheetResult,
} from "@shared/services/spreadsheetService";
import {
  SHEETS,
  type SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";

let registered = false;

interface SheetConfig {
  sheetName: string;
  spreadsheetId: string;
}

function getSheetConfig(sheetId: SheetId): SheetConfig | undefined {
  return Object.values(SHEETS).find((sheet) => sheet.sheetName === sheetId);
}

function getSheetRange(sheetName: string): string {
  return `'${sheetName.replace(/'/g, "''")}'`;
}

export function registerSpreadsheetIpc(): void {
  if (registered) return;
  registered = true;

  ipcMain.handle(
    "spreadsheet:fetchSheet",
    async (
      _event,
      sheetId: SheetId,
    ): Promise<FetchSheetResult<typeof sheetId>> => {
      const sheet = getSheetConfig(sheetId);

      if (!sheet) {
        return {
          success: false,
          unauthorized: false,
          data: [],
          error: `シート設定が見つかりません: ${sheetId}`,
        };
      }

      const url =
        `https://sheets.googleapis.com/v4/spreadsheets/` +
        `${encodeURIComponent(sheet.spreadsheetId)}/values/` +
        `${encodeURIComponent(getSheetRange(sheet.sheetName))}`;

      try {
        const response = await authService.request(url);

        const responseText = await response.text();

        if (response.status === 401) {
          return {
            success: false,
            unauthorized: true,
            data: [],
          };
        }

        if (!response.ok) {
          console.error("[SpreadsheetIPC] Google Sheets API error", {
            status: response.status,
            spreadsheetId: sheet.spreadsheetId,
            range: sheet.sheetName,
            errorText: responseText,
          });

          return {
            success: false,
            unauthorized: false,
            data: [],
            error:
              response.status === 503
                ? "Google API エラー (503)"
                : responseText || `取得エラー (Status: ${response.status})`,
          };
        }

        let json: { values?: string[][] };

        try {
          json = JSON.parse(responseText) as { values?: string[][] };
        } catch (error) {
          return {
            success: false,
            unauthorized: false,
            data: [],
            error: "Google Sheets API response is not valid JSON",
          };
        }

        return {
          success: true,
          unauthorized: false,
          data: normalizeSheetData(sheetId, json.values ?? []),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        console.error("[SpreadsheetIPC] Request failed", {
          sheetId,
          message,
        });

        return {
          success: false,
          unauthorized: false,
          data: [],
          error: message,
        };
      }
    },
  );

  console.log("[IPC] Spreadsheet handlers registered.");
}
