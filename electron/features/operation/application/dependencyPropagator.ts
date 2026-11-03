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
import type { StatusTarget } from "./statusManager";

/** 指定ノード集合に対するトポロジカルソート（Kahn法）。DAGならソート配列、循環時は空配列を返す */
function kahnSort(
  nodes: Set<string>,
  dependentsMap: Map<string, Set<string>>,
  prerequisitesMap: Map<string, Set<string>>,
): { sorted: string[]; unvisited: string[] } {
  const inDegree = new Map<string, number>();
  const queue: string[] = [];

  for (const node of nodes) {
    let degree = 0;
    const prereqs = prerequisitesMap.get(node);
    if (prereqs) {
      for (const p of prereqs) if (nodes.has(p)) degree++;
    }
    inDegree.set(node, degree);
    if (degree === 0) queue.push(node);
  }

  const sorted: string[] = [];
  let i = 0;
  while (i < queue.length) {
    const curr = queue[i++];
    sorted.push(curr);
    const deps = dependentsMap.get(curr);
    if (!deps) continue;
    for (const dep of deps) {
      if (!nodes.has(dep)) continue;
      const nextDegree = (inDegree.get(dep) ?? 0) - 1;
      inDegree.set(dep, nextDegree);
      if (nextDegree === 0) queue.push(dep);
    }
  }

  const unvisited =
    sorted.length === nodes.size
      ? []
      : [...nodes].filter((n) => !sorted.includes(n));

  return { sorted, unvisited };
}

export class DependencyPropagator {
  private readonly dependentTargets = new Map<string, Set<string>>();
  private readonly prerequisiteTargets = new Map<string, Set<string>>();
  private readonly pendingTargets = new Map<string, boolean>();
  private isPropagating = false;

  private addEdge(
    dep: string,
    target: string,
    depsMap: Map<string, Set<string>>,
    prereqsMap: Map<string, Set<string>>,
  ): void {
    if (!depsMap.has(dep)) depsMap.set(dep, new Set());
    depsMap.get(dep)!.add(target);

    if (!prereqsMap.has(target)) prereqsMap.set(target, new Set());
    prereqsMap.get(target)!.add(dep);
  }

  /** 依存関係索引を一時構築し、DAG検証成功後にのみ反映する */
  public rebuildDependencyIndex(
    targets: Iterable<StatusTarget>,
    masters?: DependencyMasters,
  ): void {
    const nextDeps = new Map<string, Set<string>>();
    const nextPrereqs = new Map<string, Set<string>>();
    const allNodes = new Set<string>();

    for (const target of targets) {
      const kanriNo = normalizeKanriNo(target.kanriNo);
      if (!kanriNo) continue;
      allNodes.add(kanriNo);

      for (const dep of normalizeDependencies(
        target.dependsOn,
        kanriNo,
        masters,
      )) {
        const depNo = normalizeKanriNo(dep);
        if (!depNo) continue;
        if (kanriNo === depNo) {
          throw new Error(
            `[DependencyPropagator] 自己依存を検出しました: ${kanriNo}`,
          );
        }
        allNodes.add(depNo);
        this.addEdge(depNo, kanriNo, nextDeps, nextPrereqs);
      }
    }

    const { unvisited } = kahnSort(allNodes, nextDeps, nextPrereqs);
    if (unvisited.length > 0) {
      throw new Error(
        `[DependencyPropagator] 循環依存を検出しました。対象管理No: ${unvisited.join(", ")}`,
      );
    }

    this.dependentTargets.clear();
    this.prerequisiteTargets.clear();
    for (const [k, v] of nextDeps) this.dependentTargets.set(k, v);
    for (const [k, v] of nextPrereqs) this.prerequisiteTargets.set(k, v);
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
      const deps = normalizeDependencies(target.dependsOn, kanriNo, masters);
      if (hasCenterFlagDependency(deps)) {
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

  /** 起点ノード群から影響を受ける下流ノードを探索しトポロジカル順序で取得 */
  private resolveTopologicalExecutionOrder(): string[] {
    const affected = new Set<string>();
    const queue: string[] = [];

    // 起点ノードと直下の下流ノードをキューに追加
    for (const [kanriNo, includeSelf] of this.pendingTargets) {
      if (includeSelf && !affected.has(kanriNo)) {
        affected.add(kanriNo);
        queue.push(kanriNo);
      }
      const deps = this.dependentTargets.get(kanriNo);
      if (deps) {
        for (const dep of deps) {
          if (!affected.has(dep)) {
            affected.add(dep);
            queue.push(dep);
          }
        }
      }
    }

    // 幅優先探索で下流全体を収集
    let qi = 0;
    while (qi < queue.length) {
      const curr = queue[qi++];
      const deps = this.dependentTargets.get(curr);
      if (!deps) continue;
      for (const dep of deps) {
        if (!affected.has(dep)) {
          affected.add(dep);
          queue.push(dep);
        }
      }
    }

    if (affected.size === 0) return [];

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

  /** トポロジカル順に確定したターゲットを順次再計算 */
  public processPropagation(recalculateFn: (kanriNo: string) => void): void {
    if (this.isPropagating || this.pendingTargets.size === 0) return;
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
