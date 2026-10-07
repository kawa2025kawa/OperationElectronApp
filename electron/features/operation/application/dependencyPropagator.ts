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

  public registerDependencyIndex(target: StatusTarget): void {
    const kanriNo = normalizeKanriNo(target.kanriNo);
    if (!kanriNo) return;

    for (const dependency of normalizeDependencies(target.dependsOn)) {
      const dependencyNo = normalizeKanriNo(dependency);
      if (!dependencyNo) continue;

      const dependents =
        this.dependentTargets.get(dependencyNo) ?? new Set<string>();

      dependents.add(kanriNo);
      this.dependentTargets.set(dependencyNo, dependents);
    }
  }

  public rebuildDependencyIndex(targets: Iterable<StatusTarget>): void {
    this.dependentTargets.clear();
    for (const target of targets) this.registerDependencyIndex(target);
  }

  public enqueueDependents(kanriNo: string): void {
    const dependents = this.dependentTargets.get(kanriNo);
    if (!dependents) return;

    for (const dependent of dependents) {
      this.propagationQueue.add(dependent);
    }
  }

  /**
   * センターフラグ(1C/2C/3C)に依存するタスクを抽出し、再計算キューに投入する
   */
  public enqueueCenterFlagDependents(targets: Map<string, StatusTarget>): void {
    for (const [kanriNo, target] of targets) {
      const dependencies = normalizeDependencies(target.dependsOn);
      if (hasCenterFlagDependency(dependencies)) {
        this.propagationQueue.add(kanriNo);
      }
    }
  }

  public enqueueAllRecalculableTargets(
    statuses: Map<string, OperationStatusState>,
    targets: Map<string, StatusTarget>,
  ): void {
    for (const [kanriNo, status] of statuses) {
      if (!targets.has(kanriNo) || isProtectedStatus(status.status)) continue;
      this.propagationQueue.add(kanriNo);
    }
  }

  public clearQueue(): void {
    this.propagationQueue.clear();
  }

  public clearAll(): void {
    this.dependentTargets.clear();
    this.propagationQueue.clear();
  }

  public processPropagation(recalculateFn: (kanriNo: string) => void): void {
    if (this.isPropagating) return;

    this.isPropagating = true;
    try {
      while (this.propagationQueue.size > 0) {
        const queue = [...this.propagationQueue];
        this.propagationQueue.clear();

        for (const kanriNo of queue) recalculateFn(kanriNo);
      }
    } finally {
      this.isPropagating = false;
    }
  }
}
