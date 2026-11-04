// electron/features/operation/application/dependencyPropagator.ts

import {
  hasCenterFlagDependency,
  isProtectedStatus,
  normalizeKanriNo,
} from "@electron/features/operation/domain/operationRules";
import {
  normalizeDependencies,
  type DependencyMasters,
} from "@electron/features/operation/domain/dependencyUtils";
import type { OperationStatusState } from "@shared/types/operation/operationTypes";
import type { StatusTarget } from "./statusTypes";

/** 指定ノード集合に対するトポロジカルソート（Kahn法）。 */
function kahnSort(
  nodes: Set<string>,
  dependentsMap: Map<string, Set<string>>,
  prerequisitesMap: Map<string, Set<string>>,
): { sorted: string[]; unvisited: string[] } {
  const inDegree = new Map<string, number>();
  const queue: string[] = [];

  for (const node of nodes) {
    let degree = 0;
    const prerequisites = prerequisitesMap.get(node);

    if (prerequisites) {
      for (const prerequisite of prerequisites) {
        if (nodes.has(prerequisite)) {
          degree++;
        }
      }
    }

    inDegree.set(node, degree);

    if (degree === 0) {
      queue.push(node);
    }
  }

  const sorted: string[] = [];
  let index = 0;

  while (index < queue.length) {
    const current = queue[index++];
    sorted.push(current);

    const dependents = dependentsMap.get(current);
    if (!dependents) continue;

    for (const dependent of dependents) {
      if (!nodes.has(dependent)) continue;

      const nextDegree = (inDegree.get(dependent) ?? 0) - 1;
      inDegree.set(dependent, nextDegree);

      if (nextDegree === 0) {
        queue.push(dependent);
      }
    }
  }

  if (sorted.length === nodes.size) {
    return {
      sorted,
      unvisited: [],
    };
  }

  const sortedSet = new Set(sorted);

  return {
    sorted,
    unvisited: [...nodes].filter((node) => !sortedSet.has(node)),
  };
}

export class DependencyPropagator {
  private readonly dependentTargets = new Map<string, Set<string>>();
  private readonly prerequisiteTargets = new Map<string, Set<string>>();
  private readonly pendingTargets = new Map<string, boolean>();
  private isPropagating = false;

  private addEdge(
    dependency: string,
    target: string,
    dependentsMap: Map<string, Set<string>>,
    prerequisitesMap: Map<string, Set<string>>,
  ): void {
    if (!dependentsMap.has(dependency)) {
      dependentsMap.set(dependency, new Set());
    }

    dependentsMap.get(dependency)!.add(target);

    if (!prerequisitesMap.has(target)) {
      prerequisitesMap.set(target, new Set());
    }

    prerequisitesMap.get(target)!.add(dependency);
  }

  /** 依存関係索引を一時構築し、DAG検証成功後にのみ反映する。 */
  public rebuildDependencyIndex(
    targets: Iterable<StatusTarget>,
    masters?: DependencyMasters,
  ): void {
    const nextDependents = new Map<string, Set<string>>();
    const nextPrerequisites = new Map<string, Set<string>>();
    const allNodes = new Set<string>();

    for (const target of targets) {
      const kanriNo = normalizeKanriNo(target.kanriNo);
      if (!kanriNo) continue;

      allNodes.add(kanriNo);

      for (const dependency of normalizeDependencies(
        target.dependsOn,
        kanriNo,
        masters,
      )) {
        const dependencyNo = normalizeKanriNo(dependency);
        if (!dependencyNo) continue;

        if (kanriNo === dependencyNo) {
          throw new Error(
            `[DependencyPropagator] 自己依存を検出しました: ${kanriNo}`,
          );
        }

        allNodes.add(dependencyNo);

        this.addEdge(dependencyNo, kanriNo, nextDependents, nextPrerequisites);
      }
    }

    const { unvisited } = kahnSort(allNodes, nextDependents, nextPrerequisites);

    if (unvisited.length > 0) {
      throw new Error(
        `[DependencyPropagator] 循環依存を検出しました。対象管理No: ${unvisited.join(", ")}`,
      );
    }

    this.dependentTargets.clear();
    this.prerequisiteTargets.clear();

    for (const [kanriNo, dependents] of nextDependents) {
      this.dependentTargets.set(kanriNo, dependents);
    }

    for (const [kanriNo, prerequisites] of nextPrerequisites) {
      this.prerequisiteTargets.set(kanriNo, prerequisites);
    }

    this.pendingTargets.clear();
  }

  public enqueueDependents(kanriNo: string): void {
    const normalized = normalizeKanriNo(kanriNo);

    if (normalized && !this.pendingTargets.has(normalized)) {
      this.pendingTargets.set(normalized, false);
    }
  }

  public enqueueCenterFlagDependents(
    targets: Map<string, StatusTarget>,
    masters?: DependencyMasters,
  ): void {
    for (const [kanriNo, target] of targets) {
      const dependencies = normalizeDependencies(
        target.dependsOn,
        kanriNo,
        masters,
      );

      if (hasCenterFlagDependency(dependencies)) {
        this.pendingTargets.set(kanriNo, true);
      }
    }
  }

  public enqueueAllRecalculableTargets(
    statuses: Map<string, OperationStatusState>,
    targets: Map<string, StatusTarget>,
  ): void {
    for (const [kanriNo] of targets) {
      if (!isProtectedStatus(statuses.get(kanriNo)?.status)) {
        this.pendingTargets.set(kanriNo, true);
      }
    }
  }

  public clearQueue(): void {
    this.pendingTargets.clear();
  }

  public clearAll(): void {
    this.dependentTargets.clear();
    this.prerequisiteTargets.clear();
    this.pendingTargets.clear();
  }

  /** 起点ノード群から影響を受ける下流ノードを探索し、トポロジカル順序で取得する。 */
  private resolveTopologicalExecutionOrder(): string[] {
    const affected = new Set<string>();
    const queue: string[] = [];

    for (const [kanriNo, includeSelf] of this.pendingTargets) {
      if (includeSelf && !affected.has(kanriNo)) {
        affected.add(kanriNo);
        queue.push(kanriNo);
      }

      const dependents = this.dependentTargets.get(kanriNo);
      if (!dependents) continue;

      for (const dependent of dependents) {
        if (!affected.has(dependent)) {
          affected.add(dependent);
          queue.push(dependent);
        }
      }
    }

    // 幅優先探索で下流全体を収集する。
    let index = 0;

    while (index < queue.length) {
      const current = queue[index++];
      const dependents = this.dependentTargets.get(current);

      if (!dependents) continue;

      for (const dependent of dependents) {
        if (!affected.has(dependent)) {
          affected.add(dependent);
          queue.push(dependent);
        }
      }
    }

    if (affected.size === 0) {
      return [];
    }

    const { sorted, unvisited } = kahnSort(
      affected,
      this.dependentTargets,
      this.prerequisiteTargets,
    );

    if (unvisited.length > 0) {
      throw new Error(
        `[DependencyPropagator] トポロジカルソートに失敗しました。対象管理No: ${unvisited.join(", ")}`,
      );
    }

    return sorted;
  }

  /** トポロジカル順に確定したターゲットを順次再計算する。 */
  public processPropagation(recalculateFn: (kanriNo: string) => void): void {
    if (this.isPropagating || this.pendingTargets.size === 0) {
      return;
    }

    this.isPropagating = true;

    try {
      const executionOrder = this.resolveTopologicalExecutionOrder();
      this.pendingTargets.clear();

      for (const kanriNo of executionOrder) {
        recalculateFn(kanriNo);
      }
    } finally {
      this.isPropagating = false;
    }
  }
}
