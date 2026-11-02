// src/shared/utils/dependency/dependencyUtils.ts

import {
  type ActiveFlags,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import type {
  OperationMaster,
  IrregularMaster,
  TodayIrregularMaster,
} from "@shared/types/operation/operationTypes";
import { isRunningStatus, isSuccessStatus } from "@shared/utils/statusUtils";

export type MasterItem =
  | OperationMaster
  | IrregularMaster
  | TodayIrregularMaster;

export interface MissingDependency {
  kanriNo: string;
  status: JobStatus | null;
  comment: string;
}

export interface DependencyCheckResult {
  ok: boolean;
  dependencies: string[];
  missingDependencies: MissingDependency[];
}

export interface DependencyMasters {
  operationMasters: OperationMaster[];
  irregularMasters: IrregularMaster[];
  todayIrregularMasters: TodayIrregularMaster[];
}

export interface DependencyStatuses {
  statuses:
    | Readonly<Record<string, OperationStatusState>>
    | ReadonlyMap<string, OperationStatusState>;
}

const CENTER_DEPENDENCY_KEYS: Readonly<Record<string, keyof ActiveFlags>> = {
  "1C": "is1CActive",
  "2C": "is2CActive",
  "3C": "is3CActive",
};

const EMPTY_CHECK_RESULT: DependencyCheckResult = {
  ok: true,
  dependencies: [],
  missingDependencies: [],
};

function getMasterLists(masters: DependencyMasters): readonly MasterItem[][] {
  return [
    masters.operationMasters,
    masters.irregularMasters,
    masters.todayIrregularMasters,
  ];
}

function findMaster(
  kanriNo: string,
  masters: DependencyMasters,
): MasterItem | undefined {
  const key = kanriNo.trim();

  for (const mastersList of getMasterLists(masters)) {
    const master = mastersList.find((item) => item.kanriNo.trim() === key);
    if (master) {
      return master;
    }
  }

  return undefined;
}

function findStatus(
  kanriNo: string,
  statuses: DependencyStatuses,
): OperationStatusState | undefined {
  const key = kanriNo.trim();
  const statusMap = statuses.statuses;

  if (statusMap instanceof Map) {
    return statusMap.get(key);
  }

  return (statusMap as Readonly<Record<string, OperationStatusState>>)[key];
}

function createMissingDependency(
  dependency: string,
  master: MasterItem | undefined,
  status: OperationStatusState | undefined,
): MissingDependency {
  return {
    kanriNo: dependency,
    status: status?.status ?? null,
    comment:
      status?.comment ??
      (master
        ? `前提 No.${dependency} 未完了`
        : `前提 No.${dependency} が存在しません`),
  };
}

/**
 * 依存先ステータスが前提条件を満たしているか判定する（特例ルール含む）
 */
function isDependencySatisfied(
  targetKanriNo: string,
  depKanriNo: string,
  status: OperationStatusState | undefined,
): boolean {
  const currentStatus = status?.status;
  if (!currentStatus) return false;

  const targetKey = targetKanriNo.trim();
  const depKey = depKanriNo.trim();

  // 特例: kanriNo 75 における kanriNo 67 の依存判定
  // 「完了 (isSuccessStatus)」または「実行中 (isRunningStatus)」で前提クリアとする
  if (targetKey === "75" && depKey === "67") {
    return isSuccessStatus(currentStatus) || isRunningStatus(currentStatus);
  }

  return isSuccessStatus(currentStatus);
}

function checkDependency(
  targetKanriNo: string,
  dependency: string,
  masters: DependencyMasters,
  statuses: DependencyStatuses,
  activeFlags?: ActiveFlags,
): MissingDependency | undefined {
  const activeKey = CENTER_DEPENDENCY_KEYS[dependency];

  // =========================================================================
  // 【重要・変更絶対禁止】
  // 1C / 2C / 3C はフッターボタン（センター状態）を表す。
  // ・ボタン ON (isActive === true)  : センター要件完了 → undefined（前提クリア）
  // ・ボタン OFF (isActive === false) : センター要件未完了 → MissingDependency を返却（待機）
  // ※OFF時に undefined を返すと未完了のまま「実施可」へ誤遷移するため、ロジックを絶対に変更しないこと。
  // =========================================================================
  if (activeKey) {
    const isActive = Boolean(activeFlags?.[activeKey]);
    if (isActive) {
      return undefined;
    }

    return {
      kanriNo: dependency,
      status: null,
      comment: `前提 ${dependency} 未完了`,
    };
  }

  const master = findMaster(dependency, masters);
  const status = findStatus(dependency, statuses);

  if (isDependencySatisfied(targetKanriNo, dependency, status)) {
    return undefined;
  }

  return createMissingDependency(dependency, master, status);
}

function checkDependencies(
  targetKanriNo: string,
  dependencies: string[],
  masters: DependencyMasters,
  statuses: DependencyStatuses,
  activeFlags?: ActiveFlags,
): DependencyCheckResult {
  if (dependencies.length === 0) {
    return {
      ...EMPTY_CHECK_RESULT,
      dependencies,
    };
  }

  const missingDependencies = dependencies
    .map((dependency) =>
      checkDependency(
        targetKanriNo,
        dependency,
        masters,
        statuses,
        activeFlags,
      ),
    )
    .filter(
      (dependency): dependency is MissingDependency => dependency !== undefined,
    );

  return {
    ok: missingDependencies.length === 0,
    dependencies,
    missingDependencies,
  };
}

/**
 * 不足している前提依存関係の管理番号を抽出してカンマ区切りの文字列を生成する
 */
export function formatMissingKanriNos(
  missingDependencies: readonly MissingDependency[],
): string {
  return missingDependencies
    .map(({ kanriNo }) => kanriNo)
    .filter(Boolean)
    .join(", ");
}

/**
 * 依存関係未達時のステータスコメントを生成する
 */
export function formatDependencyWaitingComment(
  missingDependencies: readonly MissingDependency[],
): string {
  const missingNos = formatMissingKanriNos(missingDependencies);
  if (!missingNos) {
    return "前提未完了";
  }
  return `前提未完了 (No.${missingNos})`;
}

/**
 * dependsOn の文字列・配列を展開し、"ALL" 指定がある場合は
 * operationMasters および todayIrregularMasters から自分以外の全管理Noを抽出して自動展開する
 */
export function normalizeDependencies(
  rawDependsOn: unknown,
  currentKanriNo?: string,
  masters?: DependencyMasters,
): string[] {
  if (rawDependsOn == null) {
    return [];
  }

  const values = Array.isArray(rawDependsOn) ? rawDependsOn : [rawDependsOn];

  const rawList = values
    .map(String)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((v) => Boolean(v) && v !== "-" && v !== "ー");

  const hasAll = rawList.some((v) => v.toLowerCase() === "all");

  // "ALL" が指定されている場合は、自身を除いた operationMasters と todayIrregularMasters の管理No群へ展開
  if (hasAll && masters) {
    const currentKey = currentKanriNo?.trim();
    const targetMasters = [
      ...masters.operationMasters,
      ...masters.todayIrregularMasters,
    ];

    const allKanriNos = targetMasters
      .map((item) => item.kanriNo.trim())
      .filter((id) => Boolean(id) && id !== currentKey);

    const otherDependencies = rawList.filter((v) => v.toLowerCase() !== "all");
    return Array.from(new Set([...allKanriNos, ...otherDependencies]));
  }

  return rawList;
}

export function checkJobDependencies(
  kanriNo: string,
  masters: DependencyMasters,
  statuses: DependencyStatuses,
  activeFlags?: ActiveFlags,
): DependencyCheckResult {
  const target = findMaster(kanriNo, masters);

  if (!target) {
    return EMPTY_CHECK_RESULT;
  }

  const dependencies = normalizeDependencies(
    target.dependsOn,
    kanriNo,
    masters,
  );

  return checkDependencies(
    kanriNo,
    dependencies,
    masters,
    statuses,
    activeFlags,
  );
}
