// src/renderer/hooks/usePersistentScroll.ts

import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@renderer/store";

export interface UsePersistentScrollOptions {
  /** スクロール位置を識別する一意キー（例: "operation:operation", "store"） */
  readonly scrollKey: string;
  /** 表示可能な行データが存在し、スクロール復元が可能かどうか */
  readonly canRestore: boolean;
  /** 検索フィルタ適用中かどうか（検索中は保存を上書きせず、解除時に復元する） */
  readonly isFiltered?: boolean;
  /** 外部要因（データ再取得や検索解除など）で再復元を促すための依存値 */
  readonly restoreTrigger?: unknown;
  /** 横スクロール位置が変わった際にヘッダー等を同期するためのコールバック */
  readonly onHorizontalSync?: (scrollLeft: number) => void;
}

export function usePersistentScroll<
  TElement extends HTMLElement = HTMLDivElement,
>({
  scrollKey,
  canRestore,
  isFiltered = false,
  restoreTrigger,
  onHorizontalSync,
}: UsePersistentScrollOptions) {
  const containerRef = useRef<TElement | null>(null);
  const rafSaveIdRef = useRef<number | null>(null);
  const rafRestoreIdRef = useRef<number | null>(null);
  const isRestoringRef = useRef(false);
  const previousFilteredRef = useRef(isFiltered);

  const isModalOpen = useAppStore((state) => state.modal.isOpen);
  const setScrollPosition = useAppStore((state) => state.setScrollPosition);

  const applySavedPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container || !canRestore || isFiltered) return;

    const saved = useAppStore.getState().scrollPositions[scrollKey];
    const targetTop = saved?.top ?? 0;
    const targetLeft = saved?.left ?? 0;

    isRestoringRef.current = true;

    if (rafRestoreIdRef.current !== null) {
      cancelAnimationFrame(rafRestoreIdRef.current);
    }

    rafRestoreIdRef.current = requestAnimationFrame(() => {
      rafRestoreIdRef.current = null;
      const el = containerRef.current;
      if (!el) {
        isRestoringRef.current = false;
        return;
      }

      if (el.scrollTop !== targetTop) {
        el.scrollTop = targetTop;
      }
      if (el.scrollLeft !== targetLeft) {
        el.scrollLeft = targetLeft;
      }
      onHorizontalSync?.(el.scrollLeft);
      isRestoringRef.current = false;
    });
  }, [canRestore, isFiltered, scrollKey, onHorizontalSync]);

  // 初回マウント・画面切替・データ更新・モーダル開閉のたびに最後のスクロール位置へ復元する
  useEffect(() => {
    if (!canRestore || isFiltered) return;
    applySavedPosition();
  }, [
    canRestore,
    isFiltered,
    scrollKey,
    isModalOpen,
    restoreTrigger,
    applySavedPosition,
  ]);

  // 検索フィルタ解除時のスクロール復元
  useEffect(() => {
    const wasFiltered = previousFilteredRef.current;
    previousFilteredRef.current = isFiltered;

    if (wasFiltered && !isFiltered && canRestore) {
      applySavedPosition();
    }
  }, [isFiltered, canRestore, applySavedPosition]);

  // コンテナのリサイズ（モーダルやレイアウト変動に伴う再計測）時にも位置を維持する
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      if (!canRestore || isFiltered || isRestoringRef.current) return;
      const saved = useAppStore.getState().scrollPositions[scrollKey];
      if (!saved) return;

      if (
        (saved.top > 0 && container.scrollTop === 0) ||
        (saved.left > 0 && container.scrollLeft === 0)
      ) {
        applySavedPosition();
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [canRestore, isFiltered, scrollKey, applySavedPosition]);

  // ユーザーによるスクロール操作を即時保存（意図しない0リセットは除外）
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    onHorizontalSync?.(container.scrollLeft);

    if (!canRestore || isFiltered || isRestoringRef.current) {
      return;
    }

    const { scrollTop, scrollLeft, scrollHeight, clientHeight } = container;

    // コンテンツが描画される前の一時的な0リセットイベントで保存済み位置を消さない
    if (scrollTop === 0 && scrollLeft === 0 && scrollHeight <= clientHeight) {
      return;
    }

    if (rafSaveIdRef.current !== null) {
      cancelAnimationFrame(rafSaveIdRef.current);
    }

    rafSaveIdRef.current = requestAnimationFrame(() => {
      rafSaveIdRef.current = null;
      const currentEl = containerRef.current;
      if (!currentEl || !canRestore || isFiltered || isRestoringRef.current) {
        return;
      }
      setScrollPosition(scrollKey, {
        top: currentEl.scrollTop,
        left: currentEl.scrollLeft,
      });
    });
  }, [canRestore, isFiltered, scrollKey, setScrollPosition, onHorizontalSync]);

  // アンマウント時に未反映のRAFをフラッシュして保存
  useEffect(() => {
    const container = containerRef.current;

    return () => {
      if (rafSaveIdRef.current !== null) {
        cancelAnimationFrame(rafSaveIdRef.current);
        rafSaveIdRef.current = null;
      }
      if (rafRestoreIdRef.current !== null) {
        cancelAnimationFrame(rafRestoreIdRef.current);
        rafRestoreIdRef.current = null;
      }
      if (container && canRestore && !isFiltered) {
        setScrollPosition(scrollKey, {
          top: container.scrollTop,
          left: container.scrollLeft,
        });
      }
    };
  }, [canRestore, isFiltered, scrollKey, setScrollPosition]);

  return {
    containerRef,
    handleScroll,
    restoreScrollPosition: applySavedPosition,
  };
}
