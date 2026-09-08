// src/renderer/features/spreadSheet/services/spreadsheetApi.ts

const MASTER_SPREADSHEET_ID = "1hTWA_tm_l3UmWM1lomiBkhfEQoyKbpofnPJA6DNclsw";

export interface FetchRawSheetResult {
  status: number;
  values?: string[][];
  errorText?: string;
}

export async function fetchRawSheetValues(
  dynamicRange: string,
  accessToken: string,
): Promise<FetchRawSheetResult> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${MASTER_SPREADSHEET_ID}/values/${encodeURIComponent(dynamicRange)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (res.status === 401) {
    return { status: 401 };
  }

  if (!res.ok) {
    return {
      status: res.status,
      errorText: await res.text(),
    };
  }

  const json = await res.json();

  return {
    status: 200,
    values: json.values ?? [],
  };
}
