// electron/features/system/serviceCredentialsLoader.ts

import { existsSync, readFileSync } from "node:fs";
import { resolveResourcePath } from "./systemService";

export interface ServiceCredentialsConfig {
  tracker: {
    apiKey: string;
    apiBaseUrl: string;
  };
  tempomatic: {
    baseUrl: string;
    loginId: string;
    password: string;
  };
  belcta: {
    loginUrl: string;
    userId: string;
    password: string;
  };
  webedi: {
    url: string;
    userId: string;
    password: string;
  };
  fepFtp: {
    host: string;
    port: number;
    user: string;
    password: string;
  };
}

const CREDENTIALS_FILE_NAME = "service-credentials.json";

let cachedCredentials: ServiceCredentialsConfig | null = null;

function assertNonEmptyString(value: unknown, fieldPath: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(
      `設定ファイル (${CREDENTIALS_FILE_NAME}) の "${fieldPath}" が未設定または不正です`,
    );
  }
  return value.trim();
}

export function getServiceCredentials(): ServiceCredentialsConfig {
  if (cachedCredentials) {
    return cachedCredentials;
  }

  const filePath = resolveResourcePath(CREDENTIALS_FILE_NAME);
  if (!existsSync(filePath)) {
    throw new Error(
      `サービス認証情報ファイルが見つかりません: ${filePath}`,
    );
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (error) {
    throw new Error(
      `サービス認証情報ファイルのJSON解析に失敗しました: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    );
  }

  if (typeof raw !== "object" || raw === null) {
    throw new Error(`サービス認証情報ファイルの形式が不正です: ${filePath}`);
  }

  const obj = raw as Record<string, Record<string, unknown> | undefined>;

  const portRaw = obj.fepFtp?.port;
  const port =
    typeof portRaw === "number" && Number.isFinite(portRaw) ? portRaw : 21;

  cachedCredentials = {
    tracker: {
      apiKey: assertNonEmptyString(obj.tracker?.apiKey, "tracker.apiKey"),
      apiBaseUrl: assertNonEmptyString(
        obj.tracker?.apiBaseUrl,
        "tracker.apiBaseUrl",
      ),
    },
    tempomatic: {
      baseUrl: assertNonEmptyString(
        obj.tempomatic?.baseUrl,
        "tempomatic.baseUrl",
      ),
      loginId: assertNonEmptyString(
        obj.tempomatic?.loginId,
        "tempomatic.loginId",
      ),
      password: assertNonEmptyString(
        obj.tempomatic?.password,
        "tempomatic.password",
      ),
    },
    belcta: {
      loginUrl: assertNonEmptyString(
        obj.belcta?.loginUrl,
        "belcta.loginUrl",
      ),
      userId: assertNonEmptyString(obj.belcta?.userId, "belcta.userId"),
      password: assertNonEmptyString(
        obj.belcta?.password,
        "belcta.password",
      ),
    },
    webedi: {
      url: assertNonEmptyString(obj.webedi?.url, "webedi.url"),
      userId: assertNonEmptyString(obj.webedi?.userId, "webedi.userId"),
      password: assertNonEmptyString(
        obj.webedi?.password,
        "webedi.password",
      ),
    },
    fepFtp: {
      host: assertNonEmptyString(obj.fepFtp?.host, "fepFtp.host"),
      port,
      user: assertNonEmptyString(obj.fepFtp?.user, "fepFtp.user"),
      password: assertNonEmptyString(
        obj.fepFtp?.password,
        "fepFtp.password",
      ),
    },
  };

  return cachedCredentials;
}