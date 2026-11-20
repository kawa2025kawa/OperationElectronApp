// src/renderer/features/operation/components/table/OperationTable.tsx

import { memo, useCallback } from "react";
import { createPortal } from "react-dom";
import { ContextMenu } from "@base-ui/react/context-menu";

import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { StatusContextMenu } from "@renderer/features/operation/components/contextMenu/StatusContextMenu";

import { OperationTableRow } from "./OperationTableRow";
import { useOperationTable } from "./useOperationTable";
import {
  useOperationTableContextMenuLayer,
  type OperationTableContextMenuStore,
} from "./useOperationTableContextMenu";
import type { OperationColumnMeta } from "./operationTableConfig";
import * as styles from "./operationTable.css";

interface OperationContextMenuLayerProps {
  readonly store: OperationTableContextMenuStore;
}

const OperationContextMenuLayer = memo(function OperationContextMenuLayer({
  store,
}: OperationContextMenuLayerProps) {
  const { target, laserCoords, popupRef, virtualAnchor, close } =
    useOperationTableContextMenuLayer(store);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) close();
    },
    [close],
  );

  return (
    <>
      <ContextMenu.Root
        open={target !== null}
        onOpenChange={handleOpenChange}
      >
        <StatusContextMenu
          kanriNo={target?.kanriNo ?? null}
          workName={target?.workName}
          currentStatus={target?.status}
          menuWidth={target?.menuWidth}
          anchor={virtualAnchor}
          popupRef={popupRef}
          onClose={close}
        />
      </ContextMenu.Root>

      {target &&
        laserCoords &&
        typeof document !== "undefined" &&
        createPortal(
          <svg className={styles.laserOverlay} aria-hidden="true">
            <path
              d={laserCoords.pathD}
              className={styles.laserGlowPath}
            />
            <path
              d={laserCoords.pathD}
              className={styles.laserCorePath}
            />
            <path
              d={laserCoords.pathD}
              className={styles.laserHighlightPath}
            />
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
    </>
  );
});

export const OperationTable = memo(function OperationTable() {
  "use no memo";

  const {
    headerContainerRef,
    containerRef,
    table,
    columnWidths,
    tableRows,
    colSpanCount,
    virtualItems,
    paddingTop,
    paddingBottom,
    isLoading,
    contextMenuStore,
    handleTableScroll,
    handleRowClick,
    handleMarkSuccess,
  } = useOperationTable();

  const renderColGroup = () => (
    <colgroup>
      {columnWidths.map((col) => (
        <col key={col.id} style={{ width: col.width }} />
      ))}
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
                <td colSpan={colSpanCount} className={styles.emptyCell}>
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
              <>
                {paddingTop > 0 && (
                  <tr aria-hidden="true">
                    <td
                      colSpan={colSpanCount}
                      style={{
                        height: `${paddingTop}px`,
                        padding: 0,
                        border: 0,
                      }}
                    />
                  </tr>
                )}

                {virtualItems.map((virtualRow) => {
                  const row = tableRows[virtualRow.index];
                  if (!row) return null;

                  return (
                    <OperationTableRow
                      key={row.id}
                      row={row}
                      table={table}
                      isContextOpen={false}
                      onRowClick={handleRowClick}
                      onMarkSuccess={handleMarkSuccess}
                      onStatusContextMenu={contextMenuStore.open}
                    />
                  );
                })}

                {paddingBottom > 0 && (
                  <tr aria-hidden="true">
                    <td
                      colSpan={colSpanCount}
                      style={{
                        height: `${paddingBottom}px`,
                        padding: 0,
                        border: 0,
                      }}
                    />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <OperationContextMenuLayer store={contextMenuStore} />
    </div>
  );
});

OperationTable.displayName = "OperationTable";