// electron/features/operation/application/dependencyPropagator.ts

import {
  hasCenterFlagDependency,
  normalizeKanriNo,
} from "@electron/features/operation/domain/operationRules";
import { isProtectedStatus } from "@electron/features/operation/domain/statusRules";
import { normalizeDependencies } from "@shared/utils/dependency/dependencyUtils";
import type { OperationStatusState } from "@shared/types/operation/operationTypes";
import type { StatusTarget } from "./statusNotifier";

export class DependencyPropagator {
  private dependentTargets = new Map<string, Set<string>>();
  private propagationQueue = new Set<string>();
  private isPropagating = false;

  // 指定されたターゲットの依存関係を依存先から参照できる索引に登録する。
  public registerDependencyIndex(target: StatusTarget): void {
    const kanriNo = normalizeKanriNo(target.kanriNo);
    if (!kanriNo) return;

    for (const dependency of normalizeDependencies(target.dependsOn)) {
      const dependencyNo = normalizeKanriNo(dependency);
      if (!dependencyNo) continue;

      let dependents = this.dependentTargets.get(dependencyNo);
      if (!dependents) {
        dependents = new Set<string>();
        this.dependentTargets.set(dependencyNo, dependents);
      }
      dependents.add(kanriNo);
    }
  }

  // 既存の依存関係索引を破棄し、全ターゲットから再構築する。
  public rebuildDependencyIndex(targets: Iterable<StatusTarget>): void {
    this.dependentTargets.clear();
    for (const target of targets) {
      this.registerDependencyIndex(target);
    }
  }

  // 指定された管理番号に依存するターゲットを再計算キューに追加する。
  public enqueueDependents(kanriNo: string): void {
    const dependents = this.dependentTargets.get(kanriNo);
    if (!dependents) return;

    for (const dependent of dependents) {
      this.propagationQueue.add(dependent);
    }
  }

  // センターフラグ（1C/2C/3C）に依存するターゲットを再計算キューに追加する。
  public enqueueCenterFlagDependents(targets: Map<string, StatusTarget>): void {
    for (const [kanriNo, target] of targets) {
      const dependencies = normalizeDependencies(target.dependsOn);
      if (hasCenterFlagDependency(dependencies)) {
        this.propagationQueue.add(kanriNo);
      }
    }
  }

  // 保護対象ではなく、登録済みターゲットに対応するステータスを再計算キューに追加する。
  public enqueueAllRecalculableTargets(
    statuses: Map<string, OperationStatusState>,
    targets: Map<string, StatusTarget>,
  ): void {
    for (const [kanriNo, status] of statuses) {
      if (!targets.has(kanriNo) || isProtectedStatus(status.status)) continue;
      this.propagationQueue.add(kanriNo);
    }
  }

  // 再計算キューの登録内容をすべて削除する。
  public clearQueue(): void {
    this.propagationQueue.clear();
  }

  // 依存関係索引と再計算キューをすべて初期化する。
  public clearAll(): void {
    this.dependentTargets.clear();
    this.propagationQueue.clear();
  }

  // 再計算キューが空になるまで各ターゲットの再計算処理を順次実行する。
  public processPropagation(recalculateFn: (kanriNo: string) => void): void {
    if (this.isPropagating) return;

    this.isPropagating = true;
    try {
      while (this.propagationQueue.size > 0) {
        const queue = Array.from(this.propagationQueue);
        this.propagationQueue.clear();

        for (const kanriNo of queue) {
          recalculateFn(kanriNo);
        }
      }
    } finally {
      this.isPropagating = false;
    }
  }
}
