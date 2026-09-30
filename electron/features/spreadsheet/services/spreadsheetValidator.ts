import {
  SHEETS,
  type SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";

/* ============================================================================
 * Types
 * ========================================================================== */

export interface ValidationErrorDetail {
  sheetId: SheetId;
  rowIndex: number; // CSV/スプレッドシート上の行番号（ヘッダー考慮）
  field?: string;
  message: string;
  rawValue?: unknown;
}

export interface SheetValidationResult {
  sheetId: SheetId;
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  errors: ValidationErrorDetail[];
}

export interface AllSheetsValidationResult {
  isValid: boolean;
  totalErrorsCount: number;
  resultsBySheet: Partial<Record<SheetId, SheetValidationResult>>;
  allErrors: ValidationErrorDetail[];
}

/* ============================================================================
 * Internal Validation Rules per Sheet
 * ========================================================================== */

/**
 * 必須列の存在チェックおよびデータの基本バリデーション
 */
function validateRow(
  sheetId: SheetId,
  row: Record<string, unknown>,
  rowIndex: number,
): ValidationErrorDetail[] {
  const errors: ValidationErrorDetail[] = [];

  // 1. 空行チェック
  if (!row || Object.keys(row).length === 0) {
    errors.push({
      sheetId,
      rowIndex,
      message: "空のデータ行です",
    });
    return errors;
  }

  // 2. シートごとの固有バリデーションルール定義
  // （※必要に応じて各種フィールドの型やフォーマットのチェックを追加）
  switch (sheetId) {
    case SHEETS.OPERATION.sheetName: {
      // kanriNo の必須チェック
      if (
        row.kanriNo === undefined ||
        row.kanriNo === null ||
        String(row.kanriNo).trim() === ""
      ) {
        errors.push({
          sheetId,
          rowIndex,
          field: "kanriNo",
          message: "管理No (kanriNo) が空です",
          rawValue: row.kanriNo,
        });
      }

      // scheduledTime の時刻フォーマットチェック (例: "18:00" や "09:30")
      if (row.scheduledTime && typeof row.scheduledTime === "string") {
        const timeStr = row.scheduledTime.trim();
        if (timeStr && !/^\d{1,2}:\d{2}$/.test(timeStr)) {
          errors.push({
            sheetId,
            rowIndex,
            field: "scheduledTime",
            message: `予定時刻のフォーマットが不正です: '${timeStr}' (HH:mm形式が必要)`,
            rawValue: row.scheduledTime,
          });
        }
      }
      break;
    }

    // 他のシートIDに応じた検証ルールを同様に追加可能
    default:
      break;
  }

  return errors;
}

/* ============================================================================
 * Public Validator API
 * ========================================================================== */

/**
 * 取得した全スプレッドシートデータの妥当性を検証する
 */
export function validateAllSpreadsheetData(
  dataMap: Partial<Record<SheetId, unknown[]>>,
): AllSheetsValidationResult {
  console.log(
    "[SpreadsheetValidator] Starting validation for all fetched sheets...",
  );

  const resultsBySheet: Partial<Record<SheetId, SheetValidationResult>> = {};
  const allErrors: ValidationErrorDetail[] = [];

  for (const [sheetIdKey, rows] of Object.entries(dataMap)) {
    const sheetId = sheetIdKey as SheetId;
    const sheetErrors: ValidationErrorDetail[] = [];

    if (!Array.isArray(rows)) {
      const err: ValidationErrorDetail = {
        sheetId,
        rowIndex: 0,
        message: "シートのデータ型が配列ではありません",
      };
      sheetErrors.push(err);
      allErrors.push(err);

      resultsBySheet[sheetId] = {
        sheetId,
        totalRows: 0,
        validRowsCount: 0,
        invalidRowsCount: 1,
        errors: sheetErrors,
      };
      continue;
    }

    let invalidRowsCount = 0;

    rows.forEach((row, index) => {
      // 1行目はヘッダー行を想定し、データの行番号は index + 2 とする
      const displayRowIndex = index + 2;
      const rowObject = (row ?? {}) as Record<string, unknown>;

      const errors = validateRow(sheetId, rowObject, displayRowIndex);
      if (errors.length > 0) {
        invalidRowsCount++;
        sheetErrors.push(...errors);
        allErrors.push(...errors);
      }
    });

    const totalRows = rows.length;
    const validRowsCount = totalRows - invalidRowsCount;

    resultsBySheet[sheetId] = {
      sheetId,
      totalRows,
      validRowsCount,
      invalidRowsCount,
      errors: sheetErrors,
    };

    if (sheetErrors.length > 0) {
      console.warn(
        `[SpreadsheetValidator] Sheet '${sheetId}' has ${sheetErrors.length} validation issues across ${invalidRowsCount} rows.`,
      );
    } else {
      console.log(
        `[SpreadsheetValidator] Sheet '${sheetId}' passed validation (${totalRows} rows).`,
      );
    }
  }

  const isValid = allErrors.length === 0;

  console.log(
    `[SpreadsheetValidator] Validation finished. Total Errors: ${allErrors.length}, Status: ${
      isValid ? "PASS" : "FAIL"
    }`,
  );

  return {
    isValid,
    totalErrorsCount: allErrors.length,
    resultsBySheet,
    allErrors,
  };
}
