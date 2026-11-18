// src/renderer/hooks/usePersistentScroll.ts

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useAppStore } from "@renderer/store";

export interface UsePersistentScrollOptions {
  /** スクロール位置を識別する一意キー */
  readonly scrollKey: string;
  /** スクロール復元が可能かどうか */
  readonly canRestore: boolean;
  /** 検索フィルタ適用中は保存・復元しない */
  readonly isFiltered?: boolean;
  /** データ更新などによる再復元のトリガー */
  readonly restoreTrigger?: unknown;
  /** 横スクロール位置の同期 */
  readonly onHorizontalSync?: (scrollLeft: number) => void;
  /** 復元後の仮想スクロール等との同期 */
  readonly onAfterRestore?: (position: { top: number; left: number }) => void;
}

interface ScrollPosition {
  top: number;
  left: number;
}

interface ScrollOptions {
  scrollKey: string;
  canRestore: boolean;
  isFiltered: boolean;
}

const isInitialScrollPosition = (element: HTMLElement): boolean =>
  element.scrollTop === 0 &&
  element.scrollLeft === 0 &&
  element.scrollHeight <= element.clientHeight &&
  element.scrollWidth <= element.clientWidth;

const cancelFrame = (frameId: { current: number | null }): void => {
  if (frameId.current === null) return;

  cancelAnimationFrame(frameId.current);
  frameId.current = null;
};

export function usePersistentScroll<
  TElement extends HTMLElement = HTMLDivElement,
>({
  scrollKey,
  canRestore,
  isFiltered = false,
  restoreTrigger,
  onHorizontalSync,
  onAfterRestore,
}: UsePersistentScrollOptions) {
  const containerRef = useRef<TElement | null>(null);

  const rafSaveIdRef = useRef<number | null>(null);
  const rafRestoreIdRef = useRef<number | null>(null);
  const rafRestoreReleaseIdRef = useRef<number | null>(null);

  const isRestoringRef = useRef(false);

  const optionsRef = useRef<ScrollOptions>({
    scrollKey,
    canRestore,
    isFiltered,
  });

  const setScrollPosition = useAppStore((state) => state.setScrollPosition);

  // イベント・RAFから参照する設定をコミット後に更新
  useLayoutEffect(() => {
    optionsRef.current = {
      scrollKey,
      canRestore,
      isFiltered,
    };
  }, [scrollKey, canRestore, isFiltered]);

  // 復元関連のRAFをまとめてキャンセル
  const cancelRestoreFrames = useCallback(() => {
    cancelFrame(rafRestoreIdRef);
    cancelFrame(rafRestoreReleaseIdRef);
  }, []);

  // 保存処理
  const savePosition = useCallback(
    (key: string, container: TElement) => {
      const options = optionsRef.current;

      if (
        !options.canRestore ||
        options.isFiltered ||
        options.scrollKey !== key ||
        isRestoringRef.current
      ) {
        return;
      }

      setScrollPosition(key, {
        top: container.scrollTop,
        left: container.scrollLeft,
      });
    },
    [setScrollPosition],
  );

  // 保存済み位置を復元
  const restorePosition = useCallback(() => {
    const container = containerRef.current;

    if (!container || !canRestore || isFiltered) return;

    const saved = useAppStore.getState().scrollPositions[scrollKey];

    cancelRestoreFrames();
    isRestoringRef.current = true;

    rafRestoreIdRef.current = requestAnimationFrame(() => {
      rafRestoreIdRef.current = null;

      const currentContainer = containerRef.current;

      if (!currentContainer) {
        isRestoringRef.current = false;
        return;
      }

      const position: ScrollPosition = {
        top: saved?.top ?? 0,
        left: saved?.left ?? 0,
      };

      currentContainer.scrollTop = position.top;
      currentContainer.scrollLeft = position.left;

      const restoredPosition: ScrollPosition = {
        top: currentContainer.scrollTop,
        left: currentContainer.scrollLeft,
      };

      onHorizontalSync?.(restoredPosition.left);
      onAfterRestore?.(restoredPosition);

      rafRestoreReleaseIdRef.current = requestAnimationFrame(() => {
        rafRestoreReleaseIdRef.current = null;
        isRestoringRef.current = false;
      });
    });
  }, [
    canRestore,
    isFiltered,
    scrollKey,
    onHorizontalSync,
    onAfterRestore,
    cancelRestoreFrames,
  ]);

  // 初回表示・画面切替・データ更新・検索解除時に復元
  useEffect(() => {
    if (!canRestore || isFiltered) {
      cancelRestoreFrames();
      isRestoringRef.current = false;
      return;
    }

    restorePosition();
  }, [
    canRestore,
    isFiltered,
    scrollKey,
    restoreTrigger,
    restorePosition,
    cancelRestoreFrames,
  ]);

  // スクロール位置を保存し、横スクロールを同期
  const handleScroll = useCallback(() => {
    const container = containerRef.current;

    if (!container) return;

    onHorizontalSync?.(container.scrollLeft);

    const options = optionsRef.current;

    if (!options.canRestore || options.isFiltered || isRestoringRef.current) {
      return;
    }

    const targetKey = options.scrollKey;

    cancelFrame(rafSaveIdRef);

    rafSaveIdRef.current = requestAnimationFrame(() => {
      rafSaveIdRef.current = null;

      const currentContainer = containerRef.current;

      if (!currentContainer) return;

      savePosition(targetKey, currentContainer);
    });
  }, [onHorizontalSync, savePosition]);

  // アンマウント時に保存し、保留中のRAFを解放
  useEffect(() => {
    const container = containerRef.current;

    return () => {
      cancelFrame(rafSaveIdRef);

      const wasRestoring = isRestoringRef.current;

      cancelRestoreFrames();
      isRestoringRef.current = false;

      const options = optionsRef.current;

      if (
        !container ||
        !options.canRestore ||
        options.isFiltered ||
        wasRestoring ||
        isInitialScrollPosition(container)
      ) {
        return;
      }

      setScrollPosition(options.scrollKey, {
        top: container.scrollTop,
        left: container.scrollLeft,
      });
    };
  }, [setScrollPosition, cancelRestoreFrames]);

  return {
    containerRef,
    handleScroll,
  };
}
