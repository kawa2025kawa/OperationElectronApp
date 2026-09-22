// src/renderer/features/spreadSheet/services/spreadsheetApi.ts

export interface FetchRawSheetResult {
  status: number;
  values?: string[][];
  errorText?: string;
}

/**
 * Google Sheets API から生の行列データ（string[][]）を取得する汎用通信関数
 */
export async function fetchRawSheetValues(
  spreadsheetId: string,
  range: string,
  accessToken: string,
): Promise<FetchRawSheetResult> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (res.status === 401) return { status: 401 };
    if (!res.ok) {
      return { status: res.status, errorText: await res.text() };
    }

    const json = (await res.json()) as { values?: string[][] };
    return { status: 200, values: json.values ?? [] };
  } catch (error) {
    return {
      status: 500,
      errorText: error instanceof Error ? error.message : String(error),
    };
  }
}
