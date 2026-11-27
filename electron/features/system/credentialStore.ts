// electron/features/system/credentialStore.ts

import path from "node:path";
import fs from "fs-extra";
import { fetchSheet } from "@electron/features/masterData/infrastructure/spreadsheetClient";
import { SHEETS } from "@shared/types/spreadsheet/spreadsheetTypes";
import { cleanDashCell } from "@shared/utils/sharedUtils";
import { resolveResourcePath } from "./systemService";

export type CredentialRow = Record<
  | "key"
  | "category"
  | "hostOrUrl"
  | "port"
  | "username"
  | "password"
  | "apiKey"
  | "note",
  string
>;

export const NETWORK_HOSTS = {
  MDSYUHAI01: "172.25.101.51",
  C0088150: "C0088150",
  S0088003: "S0088003",
  FTP_192_2: "192.2.2.1",
  FTP_192_12: "192.12.2.1",
  FTP_192_161: "192.161.2.1",
  SYN_TRAN_192_88: "192.88.1.3",
  LOG_192_88: "192.88.100.1",
} as const;

interface NetworkCredential {
  username: string;
  password: string;
}

export interface ServiceCredentialsConfig {
  tracker: { apiKey: string; apiBaseUrl: string };
  tempomatic: { baseUrl: string; loginId: string; password: string };
  belcta: { loginUrl: string; userId: string; password: string };
  webedi: { url: string; userId: string; password: string };
  fepFtp: { host: string; port: number; user: string; password: string };
}

export type ServiceCredentialKey = keyof ServiceCredentialsConfig;

interface NormalizedCredentialEntry {
  key: string;
  category: string;
  hostOrUrl: string;
  port: number | null;
  username: string;
  password: string;
  apiKey: string;
}

type SheetStringField = "hostOrUrl" | "username" | "password" | "apiKey";

interface ServiceCredentialSpec {
  readonly fields: Readonly<Record<string, SheetStringField>>;
  readonly defaultPort?: number;
}

const SERVICE_CREDENTIAL_SPECS: Record<
  ServiceCredentialKey,
  ServiceCredentialSpec
> = {
  tracker: {
    fields: { apiKey: "apiKey", apiBaseUrl: "hostOrUrl" },
  },
  tempomatic: {
    fields: { baseUrl: "hostOrUrl", loginId: "username", password: "password" },
  },
  belcta: {
    fields: { loginUrl: "hostOrUrl", userId: "username", password: "password" },
  },
  webedi: {
    fields: { url: "hostOrUrl", userId: "username", password: "password" },
  },
  fepFtp: {
    fields: { host: "hostOrUrl", user: "username", password: "password" },
    defaultPort: 21,
  },
};

const CREDENTIAL_FILES = {
  network: "network-credentials.json",
  service: "service-credentials.json",
  placeholderValue: "XXX",
} as const;

let isSheetCredentialsLoaded = false;
let inFlightCredentialsLoad: Promise<void> | null = null;
let sheetNetworkMap = new Map<string, NetworkCredential>();
let sheetNetworkHostAliasMap = new Map<string, string>();
let sheetServiceMap = new Map<string, NormalizedCredentialEntry>();
let fallbackNetworkCache: Map<string, NetworkCredential> | null = null;

function parsePort(rawPort: string): number | null {
  if (!rawPort) return null;
  const num = Number(rawPort);
  return Number.isInteger(num) && num > 0 ? num : null;
}

/**
- スプレッドシートから取得した Credentials 行を Main プロセスのメモリキャッシュへ格納する。
 */
export function setSpreadsheetCredentials(
  rows: readonly CredentialRow[],
): void {
  const nextNetworkMap = new Map<string, NetworkCredential>();
  const nextHostAliasMap = new Map<string, string>();
  const nextServiceMap = new Map<string, NormalizedCredentialEntry>();

  for (const row of rows) {
    const key = cleanDashCell(row.key);
    const category = cleanDashCell(row.category).toLowerCase();
    if (!key || !category) continue;

    const hostOrUrl = cleanDashCell(row.hostOrUrl);
    const port = parsePort(cleanDashCell(row.port));
    const username = cleanDashCell(row.username);
    const password = cleanDashCell(row.password);
    const apiKey = cleanDashCell(row.apiKey);

    if (category === "network") {
      const resolvedHost = hostOrUrl || key;
      nextHostAliasMap.set(key.toLowerCase(), resolvedHost);
      nextHostAliasMap.set(resolvedHost.toLowerCase(), resolvedHost);

      if (resolvedHost && username && password) {
        nextNetworkMap.set(resolvedHost.toLowerCase(), { username, password });
      }
      continue;
    }

    if (category === "service") {
      nextServiceMap.set(key, {
        key,
        category,
        hostOrUrl,
        port,
        username,
        password,
        apiKey,
      });
    }
  }

  sheetNetworkMap = nextNetworkMap;
  sheetNetworkHostAliasMap = nextHostAliasMap;
  sheetServiceMap = nextServiceMap;
  isSheetCredentialsLoaded = true;
}

export function clearSpreadsheetCredentialsCache(): void {
  sheetNetworkMap = new Map();
  sheetNetworkHostAliasMap = new Map();
  sheetServiceMap = new Map();
  isSheetCredentialsLoaded = false;
}

/**
- まだスプレッドシートの Credentials シートが未ロードの場合、オンデマンドで取得する。
 */
export async function ensureSpreadsheetCredentialsLoaded(): Promise<void> {
  if (isSheetCredentialsLoaded) {
    return;
  }

  if (inFlightCredentialsLoad) {
    return inFlightCredentialsLoad;
  }

  inFlightCredentialsLoad = (async () => {
    try {
      const result = await fetchSheet<
        typeof SHEETS.CREDENTIALS.sheetName,
        CredentialRow
      >(SHEETS.CREDENTIALS.sheetName);

      if (result.success) {
        setSpreadsheetCredentials(result.data);
      } else {
        console.warn(
          "[credentialStore] Credentials シートのオンデマンド取得に失敗:",
          result.error,
        );
      }
    } catch (error) {
      console.warn(
        "[credentialStore] Credentials シートのオンデマンド取得例外:",
        error,
      );
    } finally {
      inFlightCredentialsLoad = null;
    }
  })();

  return inFlightCredentialsLoad;
}

function loadFallbackNetworkCredentials(): Map<string, NetworkCredential> {
  if (fallbackNetworkCache) {
    return fallbackNetworkCache;
  }

  const result = new Map<string, NetworkCredential>();
  const filePath = resolveResourcePath(CREDENTIAL_FILES.network);
  if (!fs.pathExistsSync(filePath)) {
    fallbackNetworkCache = result;
    return result;
  }

  try {
    const parsed: unknown = fs.readJsonSync(filePath);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      for (const [host, entry] of Object.entries(parsed)) {
        if (typeof entry !== "object" || entry === null) continue;
        const record = entry as Record<string, unknown>;
        const username =
          typeof record.username === "string" ? record.username.trim() : "";
        const password =
          typeof record.password === "string" ? record.password.trim() : "";

        if (
          username &&
          password &&
          username !== CREDENTIAL_FILES.placeholderValue &&
          password !== CREDENTIAL_FILES.placeholderValue
        ) {
          result.set(host.trim().toLowerCase(), { username, password });
        }
      }
    }
  } catch (error) {
    console.warn(
      "[credentialStore] Failed to load fallback network-credentials.json:",
      error,
    );
  }

  fallbackNetworkCache = result;
  return result;
}

export function getNetworkCredential(host: string): NetworkCredential | null {
  const normalizedHost = host.trim().toLowerCase();
  if (!normalizedHost) return null;

  const resolvedHost =
    sheetNetworkHostAliasMap.get(normalizedHost)?.toLowerCase() ??
    normalizedHost;

  return (
    sheetNetworkMap.get(resolvedHost) ??
    loadFallbackNetworkCredentials().get(resolvedHost) ??
    null
  );
}

/**
- ネットワーク共有のUNCパス（例: \\172.25.101.51\IF\EOB棚割\SND）を組み立てる。
 */
export function getNetworkHostPath(
  hostOrAlias: string,
  ...subPaths: string[]
): string {
  const raw = hostOrAlias.trim().replace(/^[\\/]+|[\\/]+$/g, "");
  const resolvedHost =
    sheetNetworkHostAliasMap.get(raw.toLowerCase()) ?? raw;
  return path.win32.join(`\\\\${resolvedHost}`, ...subPaths);
}

function assertNonEmptyString(value: unknown, fieldPath: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(
      `認証情報 (${fieldPath}) がスプレッドシート (Credentials シート) に未設定です`,
    );
  }
  return value.trim();
}

function readRequiredSection(
  root: Record<string, Record<string, unknown> | undefined>,
  section: string,
  keys: readonly string[],
): Record<string, string> {
  const sec = root[section];
  const result: Record<string, string> = {};
  for (const key of keys) {
    result[key] = assertNonEmptyString(sec?.[key], `${section}.${key}`);
  }
  return result;
}

function loadFallbackServiceJson(): Record<
  string,
  Record<string, unknown> | undefined
> {
  const filePath = resolveResourcePath(CREDENTIAL_FILES.service);
  if (!fs.pathExistsSync(filePath)) {
    return {};
  }

  try {
    const raw: unknown = fs.readJsonSync(filePath);
    if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
      return raw as Record<string, Record<string, unknown> | undefined>;
    }
  } catch (error) {
    console.warn(
      "[credentialStore] Failed to load fallback service-credentials.json:",
      error,
    );
  }

  return {};
}

export function getServiceCredential<K extends ServiceCredentialKey>(
  serviceKey: K,
): ServiceCredentialsConfig[K] {
  const spec = SERVICE_CREDENTIAL_SPECS[serviceKey];
  const fieldEntries = Object.entries(spec.fields);
  const entry = sheetServiceMap.get(serviceKey);

  if (entry && fieldEntries.every(([, sheetCol]) => Boolean(entry[sheetCol]))) {
    const resolved: Record<string, unknown> = Object.fromEntries(
      fieldEntries.map(([targetKey, sheetCol]) => [targetKey, entry[sheetCol]]),
    );
    if (spec.defaultPort !== undefined) {
      resolved.port = entry.port ?? spec.defaultPort;
    }
    return resolved as ServiceCredentialsConfig[K];
  }

  const fb = loadFallbackServiceJson();
  const resolved = readRequiredSection(
    fb,
    serviceKey,
    fieldEntries.map(([targetKey]) => targetKey),
  ) as Record<string, unknown>;

  if (spec.defaultPort !== undefined) {
    const portRaw = fb[serviceKey]?.port;
    resolved.port =
      typeof portRaw === "number" && Number.isFinite(portRaw)
        ? portRaw
        : spec.defaultPort;
  }

  return resolved as ServiceCredentialsConfig[K];
}
