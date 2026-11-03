// src/shared/utils/dependency/dependencyUtils.ts

import {
  type ActiveFlags,
  type JobStatus,
  type OperationStatusState,
  type OperationMaster,
  type IrregularMaster,
  type TodayIrregularMaster,
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

const CENTER_KEYS: Readonly<Record<string, keyof ActiveFlags>> = {
  "1C": "is1CActive",
  "2C": "is2CActive",
  "3C": "is3CActive",
};

const EMPTY_RESULT: DependencyCheckResult = {
  ok: true,
  dependencies: [],
  missingDependencies: [],
};

function findMaster(
  kanriNo: string,
  masters: DependencyMasters,
): MasterItem | undefined {
  const key = kanriNo.trim();
  return (
    masters.operationMasters.find((m) => m.kanriNo.trim() === key) ||
    masters.irregularMasters.find((m) => m.kanriNo.trim() === key) ||
    masters.todayIrregularMasters.find((m) => m.kanriNo.trim() === key)
  );
}

function findStatus(
  kanriNo: string,
  statuses: DependencyStatuses,
): OperationStatusState | undefined {
  const key = kanriNo.trim();
  const map = statuses.statuses;
  return map instanceof Map
    ? map.get(key)
    : (map as Readonly<Record<string, OperationStatusState>>)[key];
}

function isDependencySatisfied(
  target: string,
  dep: string,
  status?: OperationStatusState,
): boolean {
  const current = status?.status;
  if (!current) return false;
  // 特例: No.75 における No.67 判定（完了または実行中）
  if (target.trim() === "75" && dep.trim() === "67") {
    return isSuccessStatus(current) || isRunningStatus(current);
  }
  return isSuccessStatus(current);
}

function checkDependency(
  targetKanriNo: string,
  dep: string,
  masters: DependencyMasters,
  statuses: DependencyStatuses,
  activeFlags?: ActiveFlags,
): MissingDependency | undefined {
  const activeKey = CENTER_KEYS[dep];

  // 1C / 2C / 3C センターフラグ判定（変更禁止ルール保持）
  if (activeKey) {
    return activeFlags?.[activeKey]
      ? undefined
      : { kanriNo: dep, status: null, comment: `前提 ${dep} 未完了` };
  }

  const status = findStatus(dep, statuses);
  if (isDependencySatisfied(targetKanriNo, dep, status)) return undefined;

  const master = findMaster(dep, masters);
  return {
    kanriNo: dep,
    status: status?.status ?? null,
    comment:
      status?.comment ??
      (master ? `前提 No.${dep} 未完了` : `前提 No.${dep} が存在しません`),
  };
}

export const formatMissingKanriNos = (
  missing: readonly MissingDependency[],
): string =>
  missing
    .map((m) => m.kanriNo)
    .filter(Boolean)
    .join(", ");

export const formatDependencyWaitingComment = (
  missing: readonly MissingDependency[],
): string => {
  const nos = formatMissingKanriNos(missing);
  return nos ? `前提未完了 (No.${nos})` : "前提未完了";
};

export function normalizeDependencies(
  rawDependsOn: unknown,
  currentKanriNo?: string,
  masters?: DependencyMasters,
): string[] {
  if (rawDependsOn == null) return [];

  const rawList = (Array.isArray(rawDependsOn) ? rawDependsOn : [rawDependsOn])
    .flatMap((v) => String(v).split(","))
    .map((v) => v.trim())
    .filter((v) => Boolean(v) && v !== "-" && v !== "ー");

  if (rawList.some((v) => v.toLowerCase() === "all") && masters) {
    const self = currentKanriNo?.trim();
    const all = [...masters.operationMasters, ...masters.todayIrregularMasters]
      .map((m) => m.kanriNo.trim())
      .filter((id) => Boolean(id) && id !== self);
    return [
      ...new Set([...all, ...rawList.filter((v) => v.toLowerCase() !== "all")]),
    ];
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
  if (!target) return EMPTY_RESULT;

  const dependencies = normalizeDependencies(
    target.dependsOn,
    kanriNo,
    masters,
  );
  if (dependencies.length === 0) return { ...EMPTY_RESULT, dependencies };

  const missingDependencies = dependencies
    .map((dep) => checkDependency(kanriNo, dep, masters, statuses, activeFlags))
    .filter((dep): dep is MissingDependency => dep !== undefined);

  return {
    ok: missingDependencies.length === 0,
    dependencies,
    missingDependencies,
  };
}
