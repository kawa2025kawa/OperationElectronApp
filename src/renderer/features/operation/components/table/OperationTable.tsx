// src/renderer/features/operation/components/table/OperationTable.tsx

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type UIEvent,
} from "react";
import { createPortal } from "react-dom";
import { useTable, type Row } from "@tanstack/react-table";
import { ContextMenu } from "@base-ui/react/context-menu";

import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import { StatusContextMenu } from "@renderer/features/operation/components/contextMenu/StatusContextMenu";
import { useAppStore } from "@renderer/store";
import { getAppViewConfig } from "@renderer/registry/appRegistry";
import { createRegistryGlobalFilter } from "@renderer/features/table/utils/tableSearchUtils";
import type {
  JobStatus,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";

import { useOperationTable } from "./useOperationTable";
import {
  EMPTY_OPERATION_ROWS,
  getOperationColumns,
  OPERATION_TABLE_FEATURES,
  type OperationColumn,
  type OperationColumnMeta,
  type TableFeaturesType,
} from "./operationTableConfig";
import * as styles from "./operationTable.css";

interface ContextMenuTargetState {
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

function getInfoRowHorizontalBounds(): { left: number; width: number } | null {
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

interface OperationTableRowProps {
  readonly row: Row<TableFeaturesType, OperationViewItem>;
  readonly table: ReturnType<
    typeof useTable<TableFeaturesType, OperationViewItem>
  >;
  readonly isContextOpen: boolean;
  readonly onRowClick: (kanriNo: string) => void;
  readonly onMarkSuccess: (kanriNo: string) => void;
  readonly onStatusContextMenu: (
    event: MouseEvent<HTMLDivElement>,
    item: OperationViewItem,
  ) => void;
}

const OperationTableRow = memo(function OperationTableRow({
  row,
  table,
  isContextOpen,
  onRowClick,
  onMarkSuccess,
  onStatusContextMenu,
}: OperationTableRowProps) {
  const kanriNo = row.original.kanriNo.trim();
  const isSelected = useAppStore(
    (state) =>
      Boolean(kanriNo) && state.selectedIds[state.currentMode] === kanriNo,
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    onMarkSuccess(kanriNo);
  };

  return (
    <tr
      tabIndex={0}
      data-context-open={isContextOpen}
      className={`${styles.tableRowBase} ${
        isSelected
          ? styles.tableRowStates.selected
          : styles.tableRowStates.clickable
      }`}
      onClick={() => onRowClick(kanriNo)}
      onKeyDown={handleKeyDown}
    >
      {row.getAllCells().map((cell) => {
        const column = cell.column.id as OperationColumn;
        const meta = cell.column.columnDef.meta as
          | OperationColumnMeta
          | undefined;
        const align = meta?.align ?? "left";

        return (
          <td
            key={cell.id}
            className={`${styles.tdBase} ${styles.alignVariants[align]}`}
          >
            {column === "status" ? (
              <div className={styles.statusCellWrapper}>
                <div
                  className={styles.statusBadgeAnchor}
                  data-context-open={isContextOpen}
                  onContextMenu={(event) =>
                    onStatusContextMenu(event, row.original)
                  }
                >
                  <StatusBadge status={row.original.status} />
                </div>
              </div>
            ) : (
              <span className={styles.cellText}>
                <table.FlexRender cell={cell} />
              </span>
            )}
          </td>
        );
      })}
    </tr>
  );
});

export const OperationTable = memo(function OperationTable() {
  const {
    currentView,
    currentMode,
    rows,
    searchTerm,
    isLoading,
    containerRef,
    handleScroll,
    handleRowClick,
    handleMarkSuccess,
  } = useOperationTable();

  const [contextMenuTarget, setContextMenuTarget] =
    useState<ContextMenuTargetState | null>(null);
  const [laserCoords, setLaserCoords] = useState<LaserCoordinates | null>(null);

  const popupRef = useRef<HTMLDivElement | null>(null);
  const headerContainerRef = useRef<HTMLDivElement | null>(null);

  const closeContextMenu = useCallback(() => {
    setContextMenuTarget(null);
    setLaserCoords(null);
  }, []);

  const handleStatusContextMenu = useCallback(
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
      setContextMenuTarget({
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

  const handleTableScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (headerContainerRef.current) {
        headerContainerRef.current.scrollLeft = event.currentTarget.scrollLeft;
      }

      if (contextMenuTarget) closeContextMenu();
      handleScroll(event);
    },
    [contextMenuTarget, closeContextMenu, handleScroll],
  );

  useLayoutEffect(() => {
    const header = headerContainerRef.current;
    const body = containerRef.current;
    if (header && body) header.scrollLeft = body.scrollLeft;
  });

  useLayoutEffect(() => {
    if (!contextMenuTarget) {
      setLaserCoords(null);
      return;
    }

    let rafId = 0;

    const updateLaser = () => {
      const popup = popupRef.current;
      if (!popup) {
        rafId = requestAnimationFrame(updateLaser);
        return;
      }

      const popupRect = popup.getBoundingClientRect();
      if (!popupRect.width && !popupRect.height) {
        rafId = requestAnimationFrame(updateLaser);
        return;
      }

      setLaserCoords(
        buildLaserCoordinates(contextMenuTarget.rowRect, popupRect),
      );
    };

    rafId = requestAnimationFrame(updateLaser);
    return () => cancelAnimationFrame(rafId);
  }, [contextMenuTarget]);

  useEffect(() => {
    if (!contextMenuTarget) return;

    window.addEventListener("resize", closeContextMenu);
    return () => window.removeEventListener("resize", closeContextMenu);
  }, [contextMenuTarget, closeContextMenu]);

  const virtualAnchor = useMemo(
    () =>
      contextMenuTarget
        ? { getBoundingClientRect: () => contextMenuTarget.pointerAnchor }
        : undefined,
    [contextMenuTarget],
  );

  const columns = useMemo(
    () => getOperationColumns(currentMode),
    [currentMode],
  );
  const searchConfig = getAppViewConfig(currentView).search;

  const globalFilterFn = useMemo(
    () =>
      createRegistryGlobalFilter<TableFeaturesType, OperationViewItem>(
        searchConfig?.searchKeys,
        searchConfig?.skipFilter,
      ),
    [searchConfig],
  );

  const table = useTable({
    features: OPERATION_TABLE_FEATURES,
    columns,
    data: rows ?? EMPTY_OPERATION_ROWS,
    getRowId: (row, index) => row.kanriNo.trim() || String(index),
    globalFilterFn,
    state: { globalFilter: searchTerm },
  });

  const leafColumns = table.getAllLeafColumns();
  const tableRows = table.getRowModel().rows;

  const renderColGroup = () => (
    <colgroup>
      {leafColumns.map((column) => {
        const meta = column.columnDef.meta as OperationColumnMeta | undefined;
        return <col key={column.id} style={{ width: meta?.width ?? "auto" }} />;
      })}
    </colgroup>
  );

  return (
    <div className={styles.container}>
      <div ref={headerContainerRef} className={styles.headerContainer}>
        <table className={styles.headerTable}>
          {renderColGroup()}
          <thead className={styles.thead}>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className={styles.headerRow}>
                {group.headers.map((header) => {
                  const meta = header.column.columnDef.meta as
                    | OperationColumnMeta
                    | undefined;
                  const align = meta?.align ?? "left";

                  return (
                    <th
                      key={header.id}
                      className={`${styles.thBase} ${styles.alignVariants[align]}`}
                    >
                      {!header.isPlaceholder && (
                        <span className={styles.cellText}>
                          <table.FlexRender header={header} />
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
        </table>
      </div>

      <div
        ref={containerRef}
        className={styles.scrollContainer}
        onScroll={handleTableScroll}
      >
        <table className={styles.table}>
          {renderColGroup()}
          <tbody>
            {isLoading || tableRows.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(leafColumns.length, 1)}
                  className={styles.emptyCell}
                >
                  {isLoading ? (
                    <div className={styles.loadingContainer}>
                      <span className={styles.loadingLabel}>LOADING...</span>
                      <div className={styles.loadingBarTrack}>
                        <div className={styles.loadingBarFill} />
                      </div>
                    </div>
                  ) : (
                    <EmptyState />
                  )}
                </td>
              </tr>
            ) : (
              tableRows.map((row) => {
                const rowKanriNo = row.original.kanriNo.trim();

                return (
                  <OperationTableRow
                    key={row.id}
                    row={row}
                    table={table}
                    isContextOpen={contextMenuTarget?.kanriNo === rowKanriNo}
                    onRowClick={handleRowClick}
                    onMarkSuccess={handleMarkSuccess}
                    onStatusContextMenu={handleStatusContextMenu}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ContextMenu.Root
        open={contextMenuTarget !== null}
        onOpenChange={(open) => {
          if (!open) closeContextMenu();
        }}
      >
        <StatusContextMenu
          kanriNo={contextMenuTarget?.kanriNo ?? null}
          workName={contextMenuTarget?.workName}
          currentStatus={contextMenuTarget?.status}
          menuWidth={contextMenuTarget?.menuWidth}
          anchor={virtualAnchor}
          popupRef={popupRef}
          onClose={closeContextMenu}
        />
      </ContextMenu.Root>

      {contextMenuTarget &&
        laserCoords &&
        typeof document !== "undefined" &&
        createPortal(
          <svg className={styles.laserOverlay} aria-hidden="true">
            <path d={laserCoords.pathD} className={styles.laserGlowPath} />
            <path d={laserCoords.pathD} className={styles.laserCorePath} />
            <path d={laserCoords.pathD} className={styles.laserHighlightPath} />
            <circle
              cx={laserCoords.startX}
              cy={laserCoords.startY}
              r={3.5}
              className={styles.laserNode}
            />
            <circle
              cx={laserCoords.endX}
              cy={laserCoords.endY}
              r={3.5}
              className={styles.laserNode}
            />
          </svg>,
          document.body,
        )}
    </div>
  );
});

OperationTable.displayName = "OperationTable";
