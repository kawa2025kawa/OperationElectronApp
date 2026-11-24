// electron/ipc/serviceIpc.ts

import fs from "fs-extra";
import path from "node:path";
import { addDays, format } from "date-fns";

import { IPC_CHANNELS } from "@shared/types/electron/ipcTypes";
import type { AuthProfile, AuthSession } from "@shared/types/auth";
import type { SpreadsheetMasterDataResponse } from "@shared/types/masterData/spreadsheetMasterDataTypes";
import {
  SHEETS,
  type Jugyoin,
  type Kokyuhyo,
  type PublicJugyoin,
  type PublicKokyuhyo,
  type PublicShop,
  type Shop,
  type ShopResourceKey,
  type StaffHiddenKey,
  type Tantou,
} from "@shared/types/spreadsheet/spreadsheetTypes";

import { authService } from "@electron/features/auth/authService";
import { getSpreadsheetMasterData } from "@electron/features/masterData/application/spreadsheetMasterDataManager";
import {
  getRdpTargets,
  startRdpSession,
} from "@electron/features/rdp/rdpService";
import {
  createGmailDraft,
  fetchPrimarySignature,
  generateDraftTemplate,
} from "@electron/features/gmail/gmailService";
import {
  uploadPdfDocuments,
  type TempomaticTargetFile,
} from "@electron/features/tempomatic/tempomaticService";
import { runJobE41 } from "@electron/features/operation/jobs/scripts/eseries/job_e41";
import { openExternalOrPath } from "@electron/features/system/systemService";
import { registerIpcHandler } from "./ipcHelper";

const SHOP_RESOURCE_KEYS = [
  "tr1ImageUrl",
  "tr2ImageUrl",
  "tr3ImageUrl",
  "tr4ImageUrl",
  "hubImageUrl",
  "outletImageUrl",
  "excelFilePath",
  "pdfFilePath",
] as const satisfies readonly ShopResourceKey[];

const ALLOWED_SHOP_KEYS = [
  "shopCode",
  "shopName",
  "shopKana",
  "openTime",
  "closeTime",
  "centerName",
  "areaName",
  "phoneNumber",
  "postalCode",
  "address",
  "mobileSales",
  "storeManagerName",
  "assistantManagerName1",
  "assistantManagerName2",
  "areaManagerName",
  "deviceCount",
  "comment",
  "printerModelB",
  "printerSerialNumberB",
  "printerPhoneB",
  "printerHolidayPhoneB",
  "printerContractIdB",
  "printerModelK",
  "printerSerialNumberK",
  "printerPhoneK",
  "printerHolidayPhoneK",
  "printerContractIdK",
  "printerModelO",
  "printerSerialNumberO",
  "printerPhoneO",
  "printerHolidayPhoneO",
  "printerContractIdO",
  "tr1Name",
  "tr1Ip",
  "tr1Model",
  "tr1LogicalName",
  "tr1PhysicalName",
  "tr2Name",
  "tr2Ip",
  "tr2Model",
  "tr2LogicalName",
  "tr2PhysicalName",
  "tr3Name",
  "tr3Ip",
  "tr3Model",
  "tr3LogicalName",
  "tr3PhysicalName",
  "tr4Name",
  "tr4Ip",
  "tr4Model",
  "tr4LogicalName",
  "tr4PhysicalName",
] as const satisfies readonly (keyof Omit<Shop, ShopResourceKey>)[];

const ALLOWED_STAFF_KEYS = [
  "id",
  "name",
  "todayAmStatus",
  "todayAmDetail",
  "todayPmStatus",
  "todayPmDetail",
  "tomorrowAmStatus",
  "tomorrowAmDetail",
  "tomorrowPmStatus",
  "tomorrowPmDetail",
  "naisen",
  "tanshuku",
  "contactMobile",
  "position",
  "email",
] as const satisfies readonly (keyof Omit<Kokyuhyo, StaffHiddenKey>)[];

const ALLOWED_JUGYOIN_KEYS = [
  ...ALLOWED_STAFF_KEYS,
  "bumon",
] as const satisfies readonly (keyof Omit<
  Jugyoin,
  StaffHiddenKey | "bumonKana"
>)[];

const ALLOWED_TANTOU_KEYS = [
  "id",
  "todayHayaban",
  "todayShikai",
  "todayUketsuke",
  "todayDenwa",
  "todayNimotsu",
  "today2F",
  "today3F",
  "todayTensou",
  "todayAmAttendanceRate",
  "todayPmAttendanceRate",
  "tomorrowHayaban",
  "tomorrowShikai",
  "tomorrowUketsuke",
  "tomorrowDenwa",
  "tomorrowNimotsu",
  "tomorrow2F",
  "tomorrow3F",
  "tomorrowTensou",
  "tomorrowAmAttendanceRate",
  "tomorrowPmAttendanceRate",
] as const satisfies readonly (keyof Tantou)[];

function pickAllowedFields<T extends object, K extends keyof T>(
  source: T,
  keys: readonly K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = source[key] ?? ("" as T[K]);
  }
  return result;
}

function isValidTarget(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return Boolean(trimmed && trimmed !== "-");
}

function toPublicShop(shop: Shop): PublicShop {
  const base = pickAllowedFields(shop, ALLOWED_SHOP_KEYS);
  const availableResources: Partial<Record<ShopResourceKey, boolean>> = {};

  for (const key of SHOP_RESOURCE_KEYS) {
    if (isValidTarget(shop[key])) {
      availableResources[key] = true;
    }
  }

  return {
    ...base,
    availableResources,
  };
}

function toPublicKokyuhyo(row: Kokyuhyo): PublicKokyuhyo {
  return {
    ...pickAllowedFields(row, ALLOWED_STAFF_KEYS),
    hasScheduleLink: isValidTarget(row.scheduleLink),
  };
}

function toPublicJugyoin(row: Jugyoin): PublicJugyoin {
  return {
    ...pickAllowedFields(row, ALLOWED_JUGYOIN_KEYS),
    hasScheduleLink: isValidTarget(row.scheduleLink),
  };
}

function toPublicTantou(row: Tantou): Tantou {
  return pickAllowedFields(row, ALLOWED_TANTOU_KEYS);
}

// 認証セッションから公開プロフィール（認証有無のみ）を生成する。
function toPublicProfile(session: AuthSession): AuthProfile {
  return {
    isAuthenticated: Boolean(session.accessToken),
  };
}

// 指定日数後の有効期限日付（yyyy/MM/dd）を算出する。
function calculateExpireDate(offsetDays = 7): string {
  return format(addDays(new Date(), offsetDays), "yyyy/MM/dd");
}

// 認証・スプレッドシート・RDP・Gmail・Tempomatic・その他業務サービスのIPCハンドラーを一括登録する。
export function registerServiceIpc(): void {
  // Auth
  registerIpcHandler(IPC_CHANNELS.AUTH.LOGIN, async () => {
    return toPublicProfile(await authService.login());
  });
  registerIpcHandler(IPC_CHANNELS.AUTH.LOAD_SESSION, async (forceRefresh) => {
    const session = await authService.loadSession(forceRefresh);
    return session ? toPublicProfile(session) : null;
  });
  registerIpcHandler(IPC_CHANNELS.AUTH.LOGOUT, () =>
    authService.clearSession(),
  );

  // Spreadsheet Master
  registerIpcHandler(
    IPC_CHANNELS.SPREADSHEET.GET_MASTER_DATA,
    async (): Promise<SpreadsheetMasterDataResponse> => {
      const masterData = await getSpreadsheetMasterData();
      return {
        stores: masterData.stores.map(toPublicShop),
        kokyuhyos: masterData.kokyuhyos.map(toPublicKokyuhyo),
        jugyoin: masterData.jugyoin.map(toPublicJugyoin),
        kokyuhyoTantous: masterData.kokyuhyoTantous.map(toPublicTantou),
        operations: masterData.operations,
        irregulars: masterData.irregulars,
        todayIrregulars: masterData.todayIrregulars,
        dailyUpdateStatus: masterData.dailyUpdateStatus,
        errors: { ...masterData.errors },
      };
    },
  );

  registerIpcHandler(
    IPC_CHANNELS.SPREADSHEET.OPEN_STAFF_SCHEDULE,
    async ({ sheetId, staffId }) => {
      const cleanId = staffId?.trim();
      if (!cleanId) {
        throw new Error("対象スタッフIDが指定されていません");
      }

      const masterData = await getSpreadsheetMasterData();
      const list =
        sheetId === SHEETS.JUGYOIN.sheetName
          ? masterData.jugyoin
          : masterData.kokyuhyos;
      const target = list.find((item) => item.id?.trim() === cleanId);
      const link = target?.scheduleLink?.trim();

      if (!link || link === "-") {
        throw new Error("スケジュールリンクが登録されていません");
      }

      await openExternalOrPath(link);
      return null;
    },
  );

  registerIpcHandler(
    IPC_CHANNELS.SPREADSHEET.OPEN_SHOP_RESOURCE,
    async ({ shopCode, resourceKey }) => {
      const cleanCode = shopCode?.trim();
      if (!cleanCode || !SHOP_RESOURCE_KEYS.includes(resourceKey)) {
        throw new Error("店舗リソースの指定が不正です");
      }

      const masterData = await getSpreadsheetMasterData();
      const target = masterData.stores.find(
        (item) => item.shopCode?.trim() === cleanCode,
      );
      const resourcePath = target?.[resourceKey]?.trim();

      if (!resourcePath || resourcePath === "-") {
        throw new Error("対象のファイルまたは画像が登録されていません");
      }

      await openExternalOrPath(resourcePath);
      return null;
    },
  );

  // RDP
  registerIpcHandler(IPC_CHANNELS.RDP.GET_MASTERS, () => getRdpTargets());
  registerIpcHandler(IPC_CHANNELS.RDP.START_SESSION, async ({ name }) => {
    await startRdpSession(name);
    return null;
  });

  // Gmail
  registerIpcHandler(IPC_CHANNELS.GMAIL.GET_SIGNATURE, () =>
    fetchPrimarySignature(),
  );
  registerIpcHandler(IPC_CHANNELS.GMAIL.GENERATE_DRAFT_TEMPLATE, (params) =>
    generateDraftTemplate(params),
  );
  registerIpcHandler(IPC_CHANNELS.GMAIL.CREATE_DRAFT, async (params) => {
    await createGmailDraft(params);
  });

  // Tempomatic
  registerIpcHandler(
    IPC_CHANNELS.TEMPOMATIC.UPLOAD_DOCUMENT,
    async (params) => {
      const rawList: TempomaticTargetFile[] =
        params.files ?? params.filePaths?.map((p) => ({ path: p })) ?? [];
      const visited = new Set<string>();
      const targets: TempomaticTargetFile[] = [];

      for (const item of rawList) {
        const filePath = item.path?.trim();
        if (!filePath || visited.has(filePath)) continue;
        visited.add(filePath);

        if (filePath.toLowerCase().endsWith(".pdf")) {
          targets.push({
            path: filePath,
            name: item.name?.trim(),
          });
        }
      }

      if (targets.length === 0) {
        throw new Error(
          "アップロード対象に有効なPDFファイル (.pdf) が含まれていません",
        );
      }

      for (const target of targets) {
        if (!(await fs.pathExists(target.path))) {
          throw new Error(
            `指定されたファイルが存在しません: ${path.basename(target.path)}`,
          );
        }
      }

      const expireDate = params.expireDate?.trim() || calculateExpireDate();
      return uploadPdfDocuments(targets, expireDate);
    },
  );

  // Other (Gift MD)
  registerIpcHandler(IPC_CHANNELS.OTHER.PROCESS_GIFT_MD, async (filePath) => {
    if (!filePath?.trim()) {
      throw new Error("ファイルパスが指定されていません");
    }

    const cleanPath = filePath.trim();
    const ext = path.extname(cleanPath).toLowerCase();
    if (ext !== ".txt" && ext !== ".dat") {
      throw new Error(
        "サポートされていない形式です (.txt, .DAT ファイルを選択してください)",
      );
    }

    if (!(await fs.pathExists(cleanPath))) {
      throw new Error(`ファイルが見つかりません: ${path.basename(cleanPath)}`);
    }

    return runJobE41(cleanPath);
  });
}