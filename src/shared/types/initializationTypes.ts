// src/shared/types/initializationTypes.ts

export const SETTLED_INIT_STATUS_VALUES = ["OK", "NG", "CONNECTED"] as const;

export type InitStatusValue = "LOADING" | "OK" | "NG" | "PENDING" | "CONNECTED";

/**
 * 初期化項目のキー定義。
 * InitStatus、初期値、ローディング値の共通ソースとする。
 */
export const INIT_STATUS_KEYS = [
  "update",
  "operation",
  "irregular",
  "auth",
  "store",
  "jugyoin",
  "kokyuhyo",
  "tantou",
] as const;

export type InitStatusKey = (typeof INIT_STATUS_KEYS)[number];

export type InitStatus = Record<InitStatusKey, InitStatusValue>;

/**
 * 初期化項目のグループ。
 * 同じ処理で一括更新する項目をまとめる。
 */
export const INIT_STATUS_GROUPS = {
  operationData: ["operation", "irregular"],
  spreadsheetData: ["store", "jugyoin", "kokyuhyo", "tantou"],
} as const satisfies Record<string, readonly InitStatusKey[]>;

/** ステータス値が確定（完了または失敗）しているか判定する */
export const isSettledStatus = (value: unknown): boolean =>
  SETTLED_INIT_STATUS_VALUES.some((status) => status === value);

/** 全ての初期化項目が確定状態か判定する */
export const isInitStatusSettled = (status: InitStatus): boolean =>
  Object.values(status).every(isSettledStatus);

/** 未確定の項目を抽出して NG に設定するパッチを動的に生成する */
export const getUnsettledStatusAsNg = (status: InitStatus): Partial<InitStatus> =>
  Object.fromEntries(
    Object.entries(status)
      .filter(([, value]) => !isSettledStatus(value))
      .map(([key]) => [key, "NG"]),
  ) as Partial<InitStatus>;

/** 全初期化項目に同じステータスを設定したオブジェクトを生成する */
export function createInitStatus(value: InitStatusValue): InitStatus {
  return Object.fromEntries(
    INIT_STATUS_KEYS.map((key) => [key, value]),
  ) as InitStatus;
}

/** 指定グループの初期化ステータス更新オブジェクトを生成する */
export function createInitStatusPatch<TKeys extends readonly InitStatusKey[]>(
  keys: TKeys,
  value: InitStatusValue,
): Partial<InitStatus> {
  return Object.fromEntries(
    keys.map((key) => [key, value]),
  ) as Partial<InitStatus>;
}

export const INITIAL_INIT_STATUS: Readonly<InitStatus> =
  createInitStatus("PENDING");
