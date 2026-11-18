// src/renderer/features/operation/components/table/OperationTable.tsx

import { memo } from "react";
import { createPortal } from "react-dom";
import { ContextMenu } from "@base-ui/react/context-menu";

import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { StatusContextMenu } from "@renderer/features/operation/components/contextMenu/StatusContextMenu";

import { OperationTableRow } from "./OperationTableRow";
import { useOperationTable } from "./useOperationTable";
import type { OperationColumnMeta } from "./operationTableConfig";
import * as styles from "./operationTable.css";

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
    contextMenu,
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

                  const rowKanriNo = row.original.kanriNo.trim();

                  return (
                    <OperationTableRow
                      key={row.id}
                      row={row}
                      table={table}
                      isContextOpen={
                        contextMenu.target?.kanriNo === rowKanriNo
                      }
                      onRowClick={handleRowClick}
                      onMarkSuccess={handleMarkSuccess}
                      onStatusContextMenu={contextMenu.open}
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

      <ContextMenu.Root
        open={contextMenu.target !== null}
        onOpenChange={(open) => {
          if (!open) contextMenu.close();
        }}
      >
        <StatusContextMenu
          kanriNo={contextMenu.target?.kanriNo ?? null}
          workName={contextMenu.target?.workName}
          currentStatus={contextMenu.target?.status}
          menuWidth={contextMenu.target?.menuWidth}
          anchor={contextMenu.virtualAnchor}
          popupRef={contextMenu.popupRef}
          onClose={contextMenu.close}
        />
      </ContextMenu.Root>

      {contextMenu.target &&
        contextMenu.laserCoords &&
        typeof document !== "undefined" &&
        createPortal(
          <svg className={styles.laserOverlay} aria-hidden="true">
            <path
              d={contextMenu.laserCoords.pathD}
              className={styles.laserGlowPath}
            />
            <path
              d={contextMenu.laserCoords.pathD}
              className={styles.laserCorePath}
            />
            <path
              d={contextMenu.laserCoords.pathD}
              className={styles.laserHighlightPath}
            />
            <circle
              cx={contextMenu.laserCoords.startX}
              cy={contextMenu.laserCoords.startY}
              r={3.5}
              className={styles.laserNode}
            />
            <circle
              cx={contextMenu.laserCoords.endX}
              cy={contextMenu.laserCoords.endY}
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