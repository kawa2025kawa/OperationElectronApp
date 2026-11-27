// electron/features/operation/jobs/scripts/eseries/job_e4.ts

import path from "node:path";
import fs from "fs-extra";
import { isSameDay } from "date-fns";

import { getSpreadsheetMasterData } from "@electron/features/masterData/application/spreadsheetMasterDataManager";
import {
  NETWORK_HOSTS,
  extractHostName,
  getNetworkHostPath,
} from "@electron/features/system/credentialStore";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  withNetworkAuthRetry,
  type NetworkAuthError,
} from "@electron/features/operation/jobs/scripts/helpers/networkAuthHelper";
import {
  checkFileUpdatedToday,
  runJobWithLogger,
  type CheckedFileStatus,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import type { JobResult } from "@shared/types/operation/operationTypes";
import type { Shop } from "@shared/types/spreadsheet/spreadsheetTypes";

const CONFIG = {
  targetHosts: [NETWORK_HOSTS.FTP_192_2, NETWORK_HOSTS.FTP_192_161] as const,
  subPaths: ["d$", "BELC", "ftp", "ORDERBOOK.pdf"] as const,
  targetFileName: "ORDERBOOK.pdf",
} as const;

type ShopByCodeMap = Map<string, Shop>;

interface TargetFileCheckResult {
  filePath: string;
  shopLabel: string;
  status: CheckedFileStatus | null;
  accessErrorCode?: string;
  authDetail?: string;
  existsInDirOnly?: boolean;
}

interface JobE4ResultData {
  checkedFiles: TargetFileCheckResult[];
  issueFiles: TargetFileCheckResult[];
}

/**
 * 2つの ORDERBOOK.pdf が本日更新されているか確認する。
 */
export async function runJobE4(): Promise<JobResult> {
  return runJobWithLogger("ファイル処理に失敗しました", async (logger) => {
    const result = await checkTargetFiles();
    return writeResultLog(logger, result);
  });
}

function normalizeShopCodeKey(rawCode: string): string {
  const trimmed = rawCode.trim();
  if (!trimmed) return "";
  const num = Number(trimmed);
  return Number.isInteger(num) && num >= 0 ? String(num) : trimmed;
}

function extractShopCodeFromHost(host: string): string {
  const match = host.trim().match(/^\d{1,3}\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  return match ? normalizeShopCodeKey(match[1]) : "";
}

async function loadShopByNormalizedCodeMap(): Promise<ShopByCodeMap> {
  const map: ShopByCodeMap = new Map();
  try {
    const masterData = await getSpreadsheetMasterData();
    for (const shop of masterData.stores) {
      const key = normalizeShopCodeKey(shop.shopCode);
      if (key && !map.has(key)) {
        map.set(key, shop);
      }
    }
  } catch (error) {
    console.warn("[job_e4] 店舗マスタの取得に失敗:", error);
  }
  return map;
}

function resolveShopLabel(
  filePath: string,
  shopMap: ReadonlyMap<string, Shop>,
): string {
  const host = extractHostName(filePath);
  const shopCodeKey = extractShopCodeFromHost(host);
  if (!shopCodeKey) {
    return host;
  }

  const shop = shopMap.get(shopCodeKey);
  if (shop) {
    const code = shop.shopCode.trim() || shopCodeKey;
    const name = shop.shopName.trim();
    return name ? `${code}: ${name}` : `店舗コード: ${code}`;
  }

  return `店舗コード: ${shopCodeKey}`;
}

async function checkFileViaParentDir(
  filePath: string,
  shopLabel: string,
  now: Date,
): Promise<TargetFileCheckResult | null> {
  const dirPath = path.dirname(filePath);
  const targetName = path.basename(filePath);

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const matched = entries.find(
      (entry) =>
        entry.isFile() && entry.name.toLowerCase() === targetName.toLowerCase(),
    );

    if (!matched) {
      return {
        filePath,
        shopLabel,
        status: {
          fileName: targetName,
          filePath,
          exists: false,
          mtime: null,
          isToday: false,
        },
      };
    }

    try {
      const stat = await fs.stat(path.join(dirPath, matched.name));
      return {
        filePath,
        shopLabel,
        status: {
          fileName: matched.name,
          filePath,
          exists: true,
          mtime: stat.mtime,
          isToday: isSameDay(stat.mtime, now),
        },
      };
    } catch {
      return {
        filePath,
        shopLabel,
        status: null,
        existsInDirOnly: true,
        accessErrorCode: "EPERM",
      };
    }
  } catch {
    return null;
  }
}

async function inspectTargetFile(
  filePath: string,
  shopLabel: string,
  now: Date,
): Promise<TargetFileCheckResult> {
  try {
    const status = await withNetworkAuthRetry(filePath, () =>
      checkFileUpdatedToday(filePath, now),
    );
    return {
      filePath,
      shopLabel,
      status,
    };
  } catch (error: unknown) {
    const netErr =
      typeof error === "object" && error !== null
        ? (error as NetworkAuthError)
        : undefined;
    const code = netErr?.code;
    const authDetail = netErr?.authDetail;

    if (code === "EPERM" || code === "EACCES") {
      const fallbackResult = await checkFileViaParentDir(
        filePath,
        shopLabel,
        now,
      );
      if (fallbackResult) {
        return {
          ...fallbackResult,
          authDetail,
        };
      }

      return {
        filePath,
        shopLabel,
        status: null,
        accessErrorCode: code,
        authDetail,
      };
    }

    throw error;
  }
}

async function checkTargetFiles(): Promise<JobE4ResultData> {
  const now = new Date();
  const shopMap = await loadShopByNormalizedCodeMap();
  const targetFiles = CONFIG.targetHosts.map((host) =>
    getNetworkHostPath(host, ...CONFIG.subPaths),
  );
  const checkedFiles = await Promise.all(
    targetFiles.map((filePath) =>
      inspectTargetFile(filePath, resolveShopLabel(filePath, shopMap), now),
    ),
  );

  const issueFiles = checkedFiles.filter(
    (item) => item.status === null || !item.status.isToday,
  );

  return {
    checkedFiles,
    issueFiles,
  };
}

function isTargetFileUpdatedToday(item: TargetFileCheckResult): boolean {
  return Boolean(item.status?.exists && item.status.isToday);
}

function writeResultLog(logger: JobLogger, result: JobE4ResultData): JobResult {
  logger.log("【対象店舗】");
  for (const item of result.checkedFiles) {
    logger.log(item.shopLabel);
  }

  logger.log("");
  logger.log("【対象ファイル名】");
  logger.log(` ${CONFIG.targetFileName}`);

  logger.log("");
  logger.log("【結果】");
  for (const item of result.checkedFiles) {
    const mark = isTargetFileUpdatedToday(item) ? "〇" : "✕";
    logger.log(`${item.shopLabel}：${mark}`);
  }

  if (result.issueFiles.length > 0) {
    const hasAccessError = result.issueFiles.some(
      (item) => item.accessErrorCode !== undefined,
    );
    const summary = hasAccessError
      ? `アクセス不可または本日未更新のファイルあり (${result.issueFiles.length}件)`
      : `本日更新されていないファイルあり (${result.issueFiles.length}件)`;

    return {
      success: true,
      kind: "needsAction",
      message: logger.needsAction(summary),
      data: result,
    };
  }

  return {
    success: true,
    kind: "success",
    message: logger.complete(),
    data: result,
  };
}
