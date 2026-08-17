// src/renderer/features/operation/helpers/dependencyHelper.ts

import type {
  JobDependency,
  JobStatus,
  OperationItem,
} from "@shared/types/operationType";

export interface MissingDependency {
  kanriNo: string;
  status: JobStatus | null | undefined;
  comment: string;
}

export interface DependencyCheckResult {
  ok: boolean;
  missingDependencies: MissingDependency[];
}

type RequiredStatus = JobStatus[] | Record<string, JobStatus[]> | undefined;

export function checkJobDependencies(
  kanriNo: string,
  entities: Record<string, OperationItem>,
  activeFlags?: Record<string, boolean>,
): DependencyCheckResult {
  const targetKey = String(kanriNo).trim();
  const entityKey = Object.keys(entities).find(
    (k) => String(k).trim() === targetKey,
  );
  const targetEntity = entityKey ? entities[entityKey] : undefined;

  const rule = targetEntity?.dependency;
  if (!rule) return success();

  // 🎯 デバッグログ：全体の開始情報と判定対象フラグの確認
  console.group(`[JobDependencyCheck] ジョブ管理番号: ${targetKey}`);
  console.log("対象ジョブ設定:", rule);
  console.log("渡された activeFlags:", activeFlags);

  // requiresActive (is1CActive 等) のチェック
  if (rule.requiresActive && rule.requiresActive.length > 0) {
    if (!activeFlags) {
      console.warn(
        "❌ [ActiveFlags NG] activeFlags が渡されていないため判定失敗",
      );
      console.groupEnd();
      return { ok: false, missingDependencies: [] };
    }
    const activeMet = rule.requiresActive.every((flagKey) => {
      const isOk = Boolean(activeFlags[flagKey]);
      if (!isOk) {
        console.warn(
          `❌ [ActiveFlag NG] フラグ '${flagKey}' が false または未定義です`,
        );
      }
      return isOk;
    });
    if (!activeMet) {
      console.groupEnd();
      return { ok: false, missingDependencies: [] };
    }
  }

  const dependsOn = getDependsOn(rule);
  if (!dependsOn.length) {
    console.log("⭕ 依存ジョブなし (requiresActive チェックのみ通過)");
    console.groupEnd();
    return success();
  }

  const results = dependsOn.map((depKanriNo) => {
    const depKey = Object.keys(entities).find(
      (k) => String(k).trim() === String(depKanriNo).trim(),
    );
    const depEntity = depKey ? entities[depKey] : undefined;

    const required = getRequiredStatus(rule.requiredStatus, depKanriNo);

    const currentStatus = depEntity?.status
      ? String(depEntity.status).toLowerCase()
      : "";
    const isMet = Boolean(
      currentStatus &&
      required.some((req) => req.toLowerCase() === currentStatus),
    );

    // 🎯 デバッグログ：各前提ジョブの個別の判定結果
    if (!depEntity) {
      console.warn(
        `❌ [DepJob NG] 前提ジョブ '${depKanriNo}' が entities 内に存在しません`,
      );
    } else if (!isMet) {
      console.warn(
        `❌ [DepJob NG] 前提ジョブ '${depKanriNo}' のステータス不一致. 現在: '${currentStatus}', 期待値: [${required.join(", ")}]`,
      );
    } else {
      console.log(
        `⭕ [DepJob OK] 前提ジョブ '${depKanriNo}' (status: ${currentStatus})`,
      );
    }

    return {
      ok: isMet,
      missing: {
        kanriNo: depKanriNo,
        status: depEntity?.status,
        comment: depEntity?.comment ?? "",
      },
    };
  });

  const ok =
    rule.condition === "some"
      ? results.some((r) => r.ok)
      : results.every((r) => r.ok);

  console.log(`判定結果: ${ok ? "⭕ 完了 (OK)" : "❌ 未完了 (NG)"}`);
  console.groupEnd();

  return ok
    ? success()
    : {
        ok: false,
        missingDependencies: results.filter((r) => !r.ok).map((r) => r.missing),
      };
}

export function getMissingDependencies(
  kanriNo: string,
  entities: Record<string, OperationItem>,
  activeFlags?: Record<string, boolean>,
): MissingDependency[] {
  return checkJobDependencies(kanriNo, entities, activeFlags)
    .missingDependencies;
}

export function getDependentKanriNos(
  kanriNo: string,
  entities: Record<string, OperationItem>,
): string[] {
  const target = String(kanriNo).trim();

  return Object.values(entities)
    .filter((entity) => {
      if (!entity.dependency) return false;
      return getDependsOn(entity.dependency).some(
        (dep) => String(dep).trim() === target,
      );
    })
    .map((entity) => String(entity.kanriNo));
}

const getDependsOn = (rule: string[] | JobDependency): string[] =>
  Array.isArray(rule) ? rule.map(String) : (rule.dependsOn ?? []).map(String);

const getRequiredStatus = (
  requiredStatus: RequiredStatus,
  kanriNo: string,
): string[] => {
  if (!requiredStatus) return ["success"];
  if (Array.isArray(requiredStatus)) return requiredStatus.map(String);

  const targetKey = String(kanriNo).trim();
  const matchedKey = Object.keys(requiredStatus).find(
    (k) => String(k).trim() === targetKey,
  );

  return matchedKey ? requiredStatus[matchedKey].map(String) : ["success"];
};

const success = (): DependencyCheckResult => ({
  ok: true,
  missingDependencies: [],
});
