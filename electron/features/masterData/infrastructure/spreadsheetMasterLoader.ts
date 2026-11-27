// electron/features/masterData/infrastructure/spreadsheetMasterLoader.ts

import {
  setSpreadsheetCredentials,
  type CredentialRow,
} from "@electron/features/system/credentialStore";
import type {
  IrregularMaster,
  OperationMaster,
} from "@shared/types/operation/operationTypes";
import type { SpreadsheetDailyUpdateStatus } from "@shared/types/spreadsheet/spreadsheetTypes";
import {
  SHEETS,
  type Jugyoin,
  type Kokyuhyo,
  type SheetData,
  type SheetId,
  type Shop,
  type Tantou,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import type { SpreadsheetMasterData } from "../application/spreadsheetMasterDataManager";
import { isSameJstDay } from "../application/todayIrregularFilter";
import type { RdpMaster } from "../../rdp/rdpMasterTypes";
import { fetchSheet } from "./spreadsheetClient";

type UpdateMeta = Record<
  "target" | "updatedAt" | "status" | "message",
  string
>;

type DefaultSheetRow<TSheetId extends SheetId> = SheetData<TSheetId>[number];

interface SheetLoadResult<TRow> {
  data: TRow[];
  error?: string;
}

const REQUIRED_UPDATE_TARGETS = [
  { key: "Orchestrator", label: "全体統合(Orchestrator)" },
  { key: SHEETS.KOKYUHYO.sheetName, label: "公休表(KokyuhyoMasterData)" },
  { key: SHEETS.JUGYOIN.sheetName, label: "従業員(JugyoinMasterData)" },
] as const;

async function loadSheetData<
  TSheetId extends SheetId,
  TRow extends object = DefaultSheetRow<TSheetId>,
>(sheetId: TSheetId): Promise<SheetLoadResult<TRow>> {
  const result = await fetchSheet<TSheetId, TRow>(sheetId);
  if (result.success) {
    return { data: result.data };
  }

  const error = result.unauthorized
    ? `${sheetId} の取得失敗: Google 認証が必要です`
    : `${sheetId} の取得失敗: ${result.error ?? "不明なエラー"}`;

  console.error(`[SpreadsheetMasterLoader] ${error}`);
  return { data: [], error };
}

function validateUpdateRecord(
  label: string,
  record: UpdateMeta | undefined,
): string | null {
  const updatedAt = record?.updatedAt?.trim() || "";
  const status = record?.status?.trim().toUpperCase() || "";
  const message = record?.message?.trim() || "";

  if (!record || !updatedAt) {
    return `${label}: 更新記録なし`;
  }
  if (status && status !== "OK") {
    return `${label}: エラー(${status}${message ? ` - ${message}` : ""})`;
  }
  if (!isSameJstDay(updatedAt)) {
    return `${label}: 本日未更新(最終: ${updatedAt})`;
  }
  return null;
}

function evaluateDailyUpdateStatus(
  metaResult: SheetLoadResult<UpdateMeta>,
): SpreadsheetDailyUpdateStatus {
  if (metaResult.error) {
    return {
      isUpdatedToday: false,
      updatedAt: null,
      kokyuhyoUpdatedAt: null,
      jugyoinUpdatedAt: null,
      status: null,
      message: null,
      warningMessage: `スプレッドシートの更新状況を確認できませんでした（${metaResult.error}）`,
    };
  }

  const rows = metaResult.data;
  if (rows.length === 0) {
    return {
      isUpdatedToday: false,
      updatedAt: null,
      kokyuhyoUpdatedAt: null,
      jugyoinUpdatedAt: null,
      status: null,
      message: null,
      warningMessage:
        "スプレッドシートの最終更新日時が記録されていません（GAS未実行の可能性）",
    };
  }

  const metaByTarget = new Map<string, UpdateMeta>();
  for (const row of rows) {
    const target = row.target?.trim();
    if (target) {
      metaByTarget.set(target, row);
    }
  }

  const orchestratorRow = metaByTarget.get("Orchestrator") ?? rows[0];
  const kokyuhyoRow =
    metaByTarget.get(SHEETS.KOKYUHYO.sheetName) ?? orchestratorRow;
  const jugyoinRow =
    metaByTarget.get(SHEETS.JUGYOIN.sheetName) ?? orchestratorRow;

  const updatedAt = orchestratorRow?.updatedAt?.trim() || null;
  const kokyuhyoUpdatedAt = kokyuhyoRow?.updatedAt?.trim() || null;
  const jugyoinUpdatedAt = jugyoinRow?.updatedAt?.trim() || null;
  const status = orchestratorRow?.status?.trim() || null;
  const message = orchestratorRow?.message?.trim() || null;

  const issues =
    metaByTarget.size > 0
      ? REQUIRED_UPDATE_TARGETS.map(({ key, label }) =>
          validateUpdateRecord(label, metaByTarget.get(key)),
        ).filter((issue): issue is string => issue !== null)
      : [validateUpdateRecord("GAS更新", orchestratorRow)].filter(
          (issue): issue is string => issue !== null,
        );

  if (issues.length > 0) {
    return {
      isUpdatedToday: false,
      updatedAt,
      kokyuhyoUpdatedAt,
      jugyoinUpdatedAt,
      status: status ?? "NG",
      message,
      warningMessage: `スプレッドシート定期更新（GAS）異常: ${issues.join(" / ")}`,
    };
  }

  return {
    isUpdatedToday: true,
    updatedAt,
    kokyuhyoUpdatedAt,
    jugyoinUpdatedAt,
    status: status ?? "OK",
    message,
    warningMessage: null,
  };
}

export async function loadSpreadsheetMasterData(): Promise<SpreadsheetMasterData> {
  const [
    stores,
    kokyuhyos,
    jugyoin,
    kokyuhyoTantous,
    operations,
    irregulars,
    rdps,
    updateMeta,
    credentials,
  ] = await Promise.all([
    loadSheetData<typeof SHEETS.STORE.sheetName, Shop>(SHEETS.STORE.sheetName),
    loadSheetData<typeof SHEETS.KOKYUHYO.sheetName, Kokyuhyo>(
      SHEETS.KOKYUHYO.sheetName,
    ),
    loadSheetData<typeof SHEETS.JUGYOIN.sheetName, Jugyoin>(
      SHEETS.JUGYOIN.sheetName,
    ),
    loadSheetData<typeof SHEETS.KOKYUHYO_TANTOU.sheetName, Tantou>(
      SHEETS.KOKYUHYO_TANTOU.sheetName,
    ),
    loadSheetData<typeof SHEETS.OPERATION.sheetName, OperationMaster>(
      SHEETS.OPERATION.sheetName,
    ),
    loadSheetData<typeof SHEETS.IRREGULAR.sheetName, IrregularMaster>(
      SHEETS.IRREGULAR.sheetName,
    ),
    loadSheetData<typeof SHEETS.RDP.sheetName, RdpMaster>(SHEETS.RDP.sheetName),
    loadSheetData<typeof SHEETS.UPDATE_META.sheetName, UpdateMeta>(
      SHEETS.UPDATE_META.sheetName,
    ),
    loadSheetData<typeof SHEETS.CREDENTIALS.sheetName, CredentialRow>(
      SHEETS.CREDENTIALS.sheetName,
    ),
  ]);

  if (!credentials.error) {
    setSpreadsheetCredentials(credentials.data);
  }

  const entries: ReadonlyArray<readonly [SheetId, SheetLoadResult<unknown>]> = [
    [SHEETS.STORE.sheetName, stores],
    [SHEETS.KOKYUHYO.sheetName, kokyuhyos],
    [SHEETS.JUGYOIN.sheetName, jugyoin],
    [SHEETS.KOKYUHYO_TANTOU.sheetName, kokyuhyoTantous],
    [SHEETS.OPERATION.sheetName, operations],
    [SHEETS.IRREGULAR.sheetName, irregulars],
    [SHEETS.RDP.sheetName, rdps],
    [SHEETS.UPDATE_META.sheetName, updateMeta],
    [SHEETS.CREDENTIALS.sheetName, credentials],
  ];

  const errors: SpreadsheetMasterData["errors"] = {};
  for (const [sheetId, result] of entries) {
    if (result.error) {
      errors[sheetId] = result.error;
    }
  }

  return {
    stores: stores.data,
    kokyuhyos: kokyuhyos.data,
    jugyoin: jugyoin.data,
    kokyuhyoTantous: kokyuhyoTantous.data,
    operations: operations.data,
    irregulars: irregulars.data,
    todayIrregulars: [],
    rdps: rdps.data,
    dailyUpdateStatus: evaluateDailyUpdateStatus(updateMeta),
    errors,
  };
}
