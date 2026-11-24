// electron/features/operation/application/dependencyPropagator.ts

import {
  isProtectedStatus,
  normalizeKanriNo,
} from "@electron/features/operation/domain/operationRules";
import {
  normalizeDependencies,
  type DependencyMasters,
} from "@electron/features/operation/domain/dependencyUtils";
import type { OperationStatusState } from "@shared/types/operation/operationTypes";
import type { StatusTarget } from "./statusTypes";

type EdgeMap = Map<string, Set<string>>;

function getOrCreateSet(map: EdgeMap, key: string): Set<string> {
  let set = map.get(key);
  if (!set) {
    set = new Set<string>();
    map.set(key, set);
  }
  return set;
}

/** 指定ノード集合に対するトポロジカルソート（Kahn法）。 */
function kahnSort(
  nodes: Set<string>,
  dependentsMap: EdgeMap,
  prerequisitesMap: EdgeMap,
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
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
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
    return { sorted, unvisited: [] };
  }

  const sortedSet = new Set(sorted);
  return {
    sorted,
    unvisited: [...nodes].filter((node) => !sortedSet.has(node)),
  };
}

export class DependencyPropagator {
  private readonly dependentTargets: EdgeMap = new Map();
  private readonly prerequisiteTargets: EdgeMap = new Map();
  private readonly pendingTargets = new Map<string, boolean>();
  private isPropagating = false;

  /** 依存関係索引を一時構築し、DAG検証成功後にのみ反映する。 */
  public rebuildDependencyIndex(
    targets: Iterable<StatusTarget>,
    masters?: DependencyMasters,
  ): void {
    const nextDependents: EdgeMap = new Map();
    const nextPrerequisites: EdgeMap = new Map();
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
        getOrCreateSet(nextDependents, dependencyNo).add(kanriNo);
        getOrCreateSet(nextPrerequisites, kanriNo).add(dependencyNo);
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
    nextDependents.forEach((v, k) => this.dependentTargets.set(k, v));
    nextPrerequisites.forEach((v, k) => this.prerequisiteTargets.set(k, v));
    this.pendingTargets.clear();
  }

  public enqueueDependents(kanriNo: string): void {
    const normalized = normalizeKanriNo(kanriNo);
    if (normalized && !this.pendingTargets.has(normalized)) {
      this.pendingTargets.set(normalized, false);
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
    const seedNodes: string[] = [];

    const enqueueNode = (kanriNo: string): void => {
      if (!affected.has(kanriNo)) {
        affected.add(kanriNo);
        seedNodes.push(kanriNo);
      }
    };

    for (const [kanriNo, includeSelf] of this.pendingTargets) {
      if (includeSelf) {
        enqueueNode(kanriNo);
      } else {
        this.dependentTargets.get(kanriNo)?.forEach(enqueueNode);
      }
    }

    for (let index = 0; index < seedNodes.length; index++) {
      this.dependentTargets.get(seedNodes[index])?.forEach(enqueueNode);
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

  /** トポロジカル順に確定したターゲットを順次再計算する（再計算中の追加キューも消化する）。 */
  public processPropagation(recalculateFn: (kanriNo: string) => void): void {
    if (this.isPropagating || this.pendingTargets.size === 0) {
      return;
    }

    this.isPropagating = true;

    try {
      while (this.pendingTargets.size > 0) {
        const executionOrder = this.resolveTopologicalExecutionOrder();
        this.pendingTargets.clear();

        for (const kanriNo of executionOrder) {
          recalculateFn(kanriNo);
        }
      }
    } finally {
      this.isPropagating = false;
    }
  }
}
