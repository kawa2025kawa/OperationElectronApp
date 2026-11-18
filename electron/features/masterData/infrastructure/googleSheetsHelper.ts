// electron/features/masterData/infrastructure/googleSheetsHelper.ts

export const GOOGLE_SHEETS_API_BASE_URL =
  "https://sheets.googleapis.com/v4/spreadsheets" as const;

export function quoteSheetName(sheetName: string): string {
  return `'${sheetName.replace(/'/g, "''")}'`;
}

export function buildSheetValuesUrl(
  spreadsheetId: string,
  sheetName: string,
  suffix = "",
  query = "",
): string {
  const encodedId = encodeURIComponent(spreadsheetId);
  const encodedRange = encodeURIComponent(quoteSheetName(sheetName));
  const queryString = query ? `?${query}` : "";
  return `${GOOGLE_SHEETS_API_BASE_URL}/${encodedId}/values/${encodedRange}${suffix}${queryString}`;
}