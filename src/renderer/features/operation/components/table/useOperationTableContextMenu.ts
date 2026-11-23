// src/renderer/features/operation/components/table/useOperationTableContextMenu.ts

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
} from "react";
import { getOperationWorkName } from "@renderer/features/operation/utils/operationDisplayUtils";
import type {
  JobStatus,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";

interface ContextMenuTarget {
  kanriNo: string;
  workName: string;
  status?: JobStatus;
  pointerAnchor: DOMRect;
  rowRect: DOMRect;
  menuWidth?: number;
}

export interface LaserCoordinates {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  pathD: string;
}

export interface OperationTableContextMenuStore {
  open: (event: MouseEvent<HTMLDivElement>, item: OperationViewItem) => void;
  close: () => void;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => ContextMenuTarget | null;
}

function getInfoRowHorizontalBounds(): {
  left: number;
  width: number;
} | null {
  const infoRow = document.querySelector<HTMLElement>(
    '[data-operation-info-list="true"] > *',
  );

  if (!infoRow) return null;

  const { left, width } = infoRow.getBoundingClientRect();

  return width > 0 ? { left, width } : null;
}

function buildLaserCoordinates(
  rowRect: DOMRect,
  popupRect: DOMRect,
): LaserCoordinates {
  const isMenuOnRight = popupRect.left >= rowRect.right - 8;
  const startX = isMenuOnRight ? rowRect.right : rowRect.left;
  const startY = rowRect.top + rowRect.height / 2;
  const endX = isMenuOnRight ? popupRect.left : popupRect.right;
  const endY = Math.min(
    Math.max(popupRect.top + 18, popupRect.top + 8),
    popupRect.bottom - 8,
  );
  const midX = startX + (isMenuOnRight ? 18 : -18);

  return {
    startX,
    startY,
    endX,
    endY,
    pathD: `M ${startX} ${startY} L ${midX} ${startY} L ${endX} ${endY}`,
  };
}

/**
- コンテキストメニューの開閉状態を OperationTable の state から分離し、
- 右クリック開閉・レーザー計測時にテーブル本体や行が再レンダリングされないようにする。
 */
export function useOperationTableContextMenuStore(): OperationTableContextMenuStore {
  const targetRef = useRef<ContextMenuTarget | null>(null);
  const listenersRef = useRef(new Set<() => void>());
  const activeHighlightRef = useRef<{
    rowEl: HTMLElement | null;
    anchorEl: HTMLElement | null;
  }>({ rowEl: null, anchorEl: null });

  const emit = useCallback(() => {
    listenersRef.current.forEach((listener) => listener());
  }, []);

  const clearHighlight = useCallback(() => {
    const { rowEl, anchorEl } = activeHighlightRef.current;
    if (rowEl) rowEl.dataset.contextOpen = "false";
    if (anchorEl) anchorEl.dataset.contextOpen = "false";
    activeHighlightRef.current = { rowEl: null, anchorEl: null };
  }, []);

  const close = useCallback(() => {
    if (targetRef.current === null) return;
    clearHighlight();
    targetRef.current = null;
    emit();
  }, [clearHighlight, emit]);

  const open = useCallback(
    (event: MouseEvent<HTMLDivElement>, item: OperationViewItem) => {
      const kanriNo = item.kanriNo.trim();
      if (!kanriNo) return;

      event.preventDefault();
      event.stopPropagation();

      clearHighlight();

      const anchorEl = event.currentTarget;
      const rowEl = anchorEl.closest("tr");

      if (rowEl) rowEl.dataset.contextOpen = "true";
      anchorEl.dataset.contextOpen = "true";
      activeHighlightRef.current = { rowEl, anchorEl };

      const rowRect = rowEl
        ? rowEl.getBoundingClientRect()
        : anchorEl.getBoundingClientRect();

      const infoRowBounds = getInfoRowHorizontalBounds();

      targetRef.current = {
        kanriNo,
        workName: getOperationWorkName(item.workName?.trim(), kanriNo),
        status: item.status,
        pointerAnchor: DOMRect.fromRect({
          x: infoRowBounds?.left ?? event.clientX + 56,
          y: event.clientY,
          width: 0,
          height: 0,
        }),
        rowRect,
        menuWidth: infoRowBounds?.width,
      };
      emit();
    },
    [clearHighlight, emit],
  );

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const getSnapshot = useCallback(() => targetRef.current, []);

  return useMemo(
    () => ({ open, close, subscribe, getSnapshot }),
    [open, close, subscribe, getSnapshot],
  );
}

export function useOperationTableContextMenuLayer(
  store: OperationTableContextMenuStore,
) {
  const target = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );

  const [laserCoords, setLaserCoords] = useState<LaserCoordinates | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const targetRef = useRef(target);

  useLayoutEffect(() => {
    targetRef.current = target;
  }, [target]);

  const popupRef = useCallback((popup: HTMLDivElement | null) => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const currentTarget = targetRef.current;
    if (!popup || !currentTarget) {
      setLaserCoords(null);
      return;
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      animationFrameRef.current = null;

      const latestTarget = targetRef.current;
      if (!latestTarget) return;

      const popupRect = popup.getBoundingClientRect();
      if (!popupRect.width && !popupRect.height) return;

      setLaserCoords(buildLaserCoordinates(latestTarget.rowRect, popupRect));
    });
  }, []);

  useEffect(() => {
    if (!target) {
      return;
    }

    window.addEventListener("resize", store.close);
    return () => {
      window.removeEventListener("resize", store.close);
    };
  }, [target, store.close]);

  useEffect(
    () => () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    },
    [],
  );

  const virtualAnchor = useMemo(
    () =>
      target
        ? { getBoundingClientRect: () => target.pointerAnchor }
        : undefined,
    [target],
  );

  return {
    target,
    laserCoords: target ? laserCoords : null,
    popupRef,
    virtualAnchor,
    close: store.close,
  };
}