// src/renderer/features/operation/components/table/OperationTable.tsx

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type UIEvent,
} from "react";
import { createPortal } from "react-dom";
import { useTable } from "@tanstack/react-table";
import { ContextMenu } from "@base-ui/react/context-menu";

import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { StatusContextMenu } from "@renderer/features/operation/components/contextMenu/StatusContextMenu";
import { getAppViewConfig } from "@renderer/registry/appRegistry";
import { createRegistryGlobalFilter } from "@renderer/features/table/utils/tableSearchUtils";
import type { OperationViewItem } from "@shared/types/operation/operationTypes";

import { OperationTableRow } from "./OperationTableRow";
import { useOperationTable } from "./useOperationTable";
import { useOperationTableContextMenu } from "./useOperationTableContextMenu";
import {
  EMPTY_OPERATION_ROWS,
  getOperationColumns,
  OPERATION_TABLE_FEATURES,
  type OperationColumnMeta,
  type TableFeaturesType,
} from "./operationTableConfig";
import * as styles from "./operationTable.css";

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

  const {
    target: contextMenuTarget,
    laserCoords,
    popupRef,
    virtualAnchor,
    open: handleStatusContextMenu,
    close: closeContextMenu,
    handleBodyScroll,
  } = useOperationTableContextMenu();

  const headerContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTableScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      if (headerContainerRef.current) {
        headerContainerRef.current.scrollLeft = target.scrollLeft;
      }

      handleBodyScroll();

      if (scrollSaveTimerRef.current !== null) return;
      scrollSaveTimerRef.current = setTimeout(() => {
        scrollSaveTimerRef.current = null;
        if (containerRef.current) {
          handleScroll({
            currentTarget: containerRef.current,
          } as UIEvent<HTMLDivElement>);
        }
      }, 150);
    },
    [containerRef, handleBodyScroll, handleScroll],
  );

  useEffect(() => {
    return () => {
      if (scrollSaveTimerRef.current !== null) {
        clearTimeout(scrollSaveTimerRef.current);
        scrollSaveTimerRef.current = null;
      }
    };
  }, []);

  useLayoutEffect(() => {
    const header = headerContainerRef.current;
    const body = containerRef.current;
    if (header && body) header.scrollLeft = body.scrollLeft;
  }, [containerRef, currentMode]);

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
