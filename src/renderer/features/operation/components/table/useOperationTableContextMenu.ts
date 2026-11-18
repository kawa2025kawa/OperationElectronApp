// src/renderer/features/operation/components/table/useOperationTableContextMenu.ts

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
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

interface LaserCoordinates {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  pathD: string;
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

export function useOperationTableContextMenu() {
  const [target, setTarget] = useState<ContextMenuTarget | null>(null);
  const [laserCoords, setLaserCoords] = useState<LaserCoordinates | null>(null);

  const animationFrameRef = useRef<number | null>(null);

  const close = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setTarget(null);
    setLaserCoords(null);
  }, []);

  const popupRef = useCallback(
    (popup: HTMLDivElement | null) => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (!popup || !target) return;

      animationFrameRef.current = requestAnimationFrame(() => {
        animationFrameRef.current = null;

        const popupRect = popup.getBoundingClientRect();

        if (!popupRect.width && !popupRect.height) return;

        setLaserCoords(buildLaserCoordinates(target.rowRect, popupRect));
      });
    },
    [target],
  );

  const open = useCallback(
    (event: MouseEvent<HTMLDivElement>, item: OperationViewItem) => {
      const kanriNo = item.kanriNo.trim();

      if (!kanriNo) return;

      event.preventDefault();
      event.stopPropagation();

      const rowEl = event.currentTarget.closest("tr");
      const rowRect = rowEl
        ? rowEl.getBoundingClientRect()
        : event.currentTarget.getBoundingClientRect();

      const infoRowBounds = getInfoRowHorizontalBounds();

      setLaserCoords(null);
      setTarget({
        kanriNo,
        workName: item.workName?.trim() || `No.${kanriNo}`,
        status: item.status,
        pointerAnchor: DOMRect.fromRect({
          x: infoRowBounds?.left ?? event.clientX + 56,
          y: event.clientY,
          width: 0,
          height: 0,
        }),
        rowRect,
        menuWidth: infoRowBounds?.width,
      });
    },
    [],
  );

  const handleBodyScroll = useCallback(() => {
    if (target) close();
  }, [target, close]);

  useEffect(() => {
    if (!target) return;

    window.addEventListener("resize", close);

    return () => {
      window.removeEventListener("resize", close);
    };
  }, [target, close]);

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
    open,
    close,
    handleBodyScroll,
  };
}
