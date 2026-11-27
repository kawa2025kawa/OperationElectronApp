// src/renderer/hooks/usePersistentScroll.ts

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useAppStore } from "@renderer/store";

interface ScrollPosition {
  top: number;
  left: number;
}

interface UsePersistentScrollOptions {
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
  readonly onAfterRestore?: (position: ScrollPosition) => void;
}

interface LatestRefs {
  scrollKey: string;
  canRestore: boolean;
  isFiltered: boolean;
  onHorizontalSync?: (scrollLeft: number) => void;
  onAfterRestore?: (position: ScrollPosition) => void;
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

  const latestRef = useRef<LatestRefs>({
    scrollKey,
    canRestore,
    isFiltered,
    onHorizontalSync,
    onAfterRestore,
  });

  const setScrollPosition = useAppStore((state) => state.setScrollPosition);

  useLayoutEffect(() => {
    latestRef.current = {
      scrollKey,
      canRestore,
      isFiltered,
      onHorizontalSync,
      onAfterRestore,
    };
  });

  const cancelRestoreFrames = useCallback(() => {
    cancelFrame(rafRestoreIdRef);
    cancelFrame(rafRestoreReleaseIdRef);
  }, []);

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

      currentContainer.scrollTop = saved?.top ?? 0;
      currentContainer.scrollLeft = saved?.left ?? 0;

      const restoredPosition: ScrollPosition = {
        top: currentContainer.scrollTop,
        left: currentContainer.scrollLeft,
      };

      latestRef.current.onHorizontalSync?.(restoredPosition.left);
      latestRef.current.onAfterRestore?.(restoredPosition);

      rafRestoreReleaseIdRef.current = requestAnimationFrame(() => {
        rafRestoreReleaseIdRef.current = null;
        isRestoringRef.current = false;
      });
    });
  }, [canRestore, isFiltered, scrollKey, cancelRestoreFrames]);

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

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const latest = latestRef.current;
    latest.onHorizontalSync?.(container.scrollLeft);

    if (!latest.canRestore || latest.isFiltered || isRestoringRef.current) {
      return;
    }

    const targetKey = latest.scrollKey;
    cancelFrame(rafSaveIdRef);

    rafSaveIdRef.current = requestAnimationFrame(() => {
      rafSaveIdRef.current = null;

      const currentContainer = containerRef.current;
      const current = latestRef.current;
      if (
        !currentContainer ||
        !current.canRestore ||
        current.isFiltered ||
        current.scrollKey !== targetKey ||
        isRestoringRef.current
      ) {
        return;
      }

      setScrollPosition(targetKey, {
        top: currentContainer.scrollTop,
        left: currentContainer.scrollLeft,
      });
    });
  }, [setScrollPosition]);

  useEffect(() => {
    const container = containerRef.current;

    return () => {
      cancelFrame(rafSaveIdRef);

      const wasRestoring = isRestoringRef.current;
      cancelRestoreFrames();
      isRestoringRef.current = false;

      const latest = latestRef.current;
      if (
        !container ||
        !latest.canRestore ||
        latest.isFiltered ||
        wasRestoring ||
        isInitialScrollPosition(container)
      ) {
        return;
      }

      setScrollPosition(latest.scrollKey, {
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
