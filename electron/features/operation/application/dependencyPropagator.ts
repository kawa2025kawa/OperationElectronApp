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

interface PendingTargetEntry {
  kanriNo: string;
  includeSelf: boolean;
}

interface DependencyIndex {
  dependentTargets: Map<string, Set<string>>;
  prerequisiteTargets: Map<string, Set<string>>;
}

export class DependencyPropagator {
  // 先行ノード -> 後続ノード一覧 (prerequisite -> dependents)
  private readonly dependentTargets = new Map<string, Set<string>>();

  // 後続ノード -> 先行ノード一覧 (target -> prerequisites)
  private readonly prerequisiteTargets = new Map<string, Set<string>>();

  // 今回の伝播で評価起点となるターゲット一覧
  private readonly pendingTargets = new Map<string, boolean>();

  private isPropagating = false;

  // 依存エッジを追加する。
  private addDependencyEdge(
    dependencyNo: string,
    kanriNo: string,
    index: DependencyIndex,
  ): void {
    let dependents = index.dependentTargets.get(dependencyNo);

    if (!dependents) {
      dependents = new Set<string>();
      index.dependentTargets.set(dependencyNo, dependents);
    }

    dependents.add(kanriNo);

    let prerequisites = index.prerequisiteTargets.get(kanriNo);

    if (!prerequisites) {
      prerequisites = new Set<string>();
      index.prerequisiteTargets.set(kanriNo, prerequisites);
    }

    prerequisites.add(dependencyNo);
  }

  // Kahn法でグラフ全体を検証し、循環により処理できないノードを返す。
  private findCycleNodes(index: DependencyIndex): string[] {
    const nodes = new Set<string>();

    for (const [node, dependents] of index.dependentTargets) {
      nodes.add(node);

      for (const dependent of dependents) {
        nodes.add(dependent);
      }
    }

    for (const [node, prerequisites] of index.prerequisiteTargets) {
      nodes.add(node);

      for (const prerequisite of prerequisites) {
        nodes.add(prerequisite);
      }
    }

    const inDegree = new Map<string, number>();

    for (const node of nodes) {
      inDegree.set(node, index.prerequisiteTargets.get(node)?.size ?? 0);
    }

    const readyNodes: string[] = [];

    for (const [node, degree] of inDegree) {
      if (degree === 0) {
        readyNodes.push(node);
      }
    }

    let indexPosition = 0;
    let processedCount = 0;

    while (indexPosition < readyNodes.length) {
      const current = readyNodes[indexPosition++];
      processedCount++;

      const dependents = index.dependentTargets.get(current);
      if (!dependents) continue;

      for (const dependent of dependents) {
        const nextDegree = (inDegree.get(dependent) ?? 0) - 1;

        inDegree.set(dependent, nextDegree);

        if (nextDegree === 0) {
          readyNodes.push(dependent);
        }
      }
    }

    if (processedCount === nodes.size) {
      return [];
    }

    return [...inDegree.entries()]
      .filter(([, degree]) => degree > 0)
      .map(([node]) => node);
  }

  // 依存関係索引を一時構築し、DAG検証成功後にのみ反映する。
  public rebuildDependencyIndex(
    targets: Iterable<StatusTarget>,
    masters?: DependencyMasters,
  ): void {
    const nextIndex: DependencyIndex = {
      dependentTargets: new Map<string, Set<string>>(),
      prerequisiteTargets: new Map<string, Set<string>>(),
    };

    for (const target of targets) {
      const kanriNo = normalizeKanriNo(target.kanriNo);
      if (!kanriNo) continue;

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

        this.addDependencyEdge(dependencyNo, kanriNo, nextIndex);
      }
    }

    const cycleNodes = this.findCycleNodes(nextIndex);

    if (cycleNodes.length > 0) {
      throw new Error(
        `[DependencyPropagator] 循環依存を検出しました。対象管理No: ${cycleNodes.join(", ")}`,
      );
    }

    // 検証成功後に既存インデックスを置き換える。
    this.dependentTargets.clear();
    this.prerequisiteTargets.clear();

    for (const [node, dependents] of nextIndex.dependentTargets) {
      this.dependentTargets.set(node, dependents);
    }

    for (const [node, prerequisites] of nextIndex.prerequisiteTargets) {
      this.prerequisiteTargets.set(node, prerequisites);
    }

    this.pendingTargets.clear();
  }

  // 指定された管理番号の下流ターゲットを再計算対象に追加する。
  public enqueueDependents(kanriNo: string): void {
    const normalized = normalizeKanriNo(kanriNo);
    if (!normalized) return;

    const current = this.pendingTargets.get(normalized);

    if (current === undefined) {
      this.pendingTargets.set(normalized, false);
    }
  }

  // センターフラグに依存するターゲットを再計算対象に追加する。
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

  // 保護対象を除く登録済みターゲットを再計算対象に追加する。
  public enqueueAllRecalculableTargets(
    statuses: Map<string, OperationStatusState>,
    targets: Map<string, StatusTarget>,
  ): void {
    for (const [kanriNo] of targets) {
      const status = statuses.get(kanriNo);

      if (isProtectedStatus(status?.status)) {
        continue;
      }

      this.pendingTargets.set(kanriNo, true);
    }
  }

  // 再計算キューの登録内容をすべて削除する。
  public clearQueue(): void {
    this.pendingTargets.clear();
  }

  // 依存関係索引と再計算キューをすべて初期化する。
  public clearAll(): void {
    this.dependentTargets.clear();
    this.prerequisiteTargets.clear();
    this.pendingTargets.clear();
  }

  // 起点ノード群から影響を受ける下流ノードをトポロジカル順序で取得する。
  private resolveTopologicalExecutionOrder(
    entries: PendingTargetEntry[],
  ): string[] {
    const affected = new Set<string>();
    const queue: string[] = [];

    for (const { kanriNo, includeSelf } of entries) {
      if (includeSelf && !affected.has(kanriNo)) {
        affected.add(kanriNo);
        queue.push(kanriNo);
      }

      const dependents = this.dependentTargets.get(kanriNo);
      if (!dependents) continue;

      for (const dependent of dependents) {
        if (affected.has(dependent)) continue;

        affected.add(dependent);
        queue.push(dependent);
      }
    }

    let queueIndex = 0;

    while (queueIndex < queue.length) {
      const current = queue[queueIndex++];
      const dependents = this.dependentTargets.get(current);

      if (!dependents) continue;

      for (const dependent of dependents) {
        if (affected.has(dependent)) continue;

        affected.add(dependent);
        queue.push(dependent);
      }
    }

    if (affected.size === 0) return [];

    // 影響範囲内の入次数を計算する。
    const inDegree = new Map<string, number>();

    for (const node of affected) {
      let degree = 0;
      const prerequisites = this.prerequisiteTargets.get(node);

      if (prerequisites) {
        for (const prerequisite of prerequisites) {
          if (affected.has(prerequisite)) {
            degree++;
          }
        }
      }

      inDegree.set(node, degree);
    }

    // 入次数0のノードからKahn法で処理する。
    const readyNodes: string[] = [];

    for (const [node, degree] of inDegree) {
      if (degree === 0) {
        readyNodes.push(node);
      }
    }

    const sortedOrder: string[] = [];
    let readyIndex = 0;

    while (readyIndex < readyNodes.length) {
      const current = readyNodes[readyIndex++];
      sortedOrder.push(current);

      const dependents = this.dependentTargets.get(current);
      if (!dependents) continue;

      for (const dependent of dependents) {
        if (!affected.has(dependent)) continue;

        const nextDegree = (inDegree.get(dependent) ?? 0) - 1;

        inDegree.set(dependent, nextDegree);

        if (nextDegree === 0) {
          readyNodes.push(dependent);
        }
      }
    }

    // 登録時のDAG検証を通過しているため、残存ノードは内部不整合。
    if (sortedOrder.length !== affected.size) {
      const sortedNodes = new Set(sortedOrder);
      const unresolvedNodes = [...affected].filter(
        (node) => !sortedNodes.has(node),
      );

      throw new Error(
        `[DependencyPropagator] トポロジカルソートに失敗しました。対象管理No: ${unresolvedNodes.join(", ")}`,
      );
    }

    return sortedOrder;
  }

  // トポロジカル順に確定した配列を先頭から1回ずつ順次評価する。
  public processPropagation(recalculateFn: (kanriNo: string) => void): void {
    if (this.isPropagating || this.pendingTargets.size === 0) return;

    this.isPropagating = true;

    try {
      const entries: PendingTargetEntry[] = Array.from(
        this.pendingTargets.entries(),
      ).map(([kanriNo, includeSelf]) => ({ kanriNo, includeSelf }));

      this.pendingTargets.clear();

      const executionOrder = this.resolveTopologicalExecutionOrder(entries);

      for (const kanriNo of executionOrder) {
        recalculateFn(kanriNo);
      }
    } finally {
      this.isPropagating = false;
    }
  }
}
