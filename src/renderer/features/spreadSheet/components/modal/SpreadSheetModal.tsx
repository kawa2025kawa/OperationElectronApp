import React, {
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import {
  SHEET_IDS,
  type SheetId,
  type SheetRowMap,
  type Shop,
} from "@shared/types/spreadsheet";
import { SPREADSHEET_MODAL_MAP } from "./modalRegistry";
import {
  SpreadSheetModalContext,
  type SpreadSheetModalContextType,
} from "./spreadSheetModalContext";
import { useShopModalFooter } from "./hooks/useShopModalFooter";
import * as styles from "./spreadSheetModal.css";

/* ============================================================================
 * Provider (UI Scaffolding)
 * ============================================================================ */
export const SpreadSheetModalProvider: React.FC<
  PropsWithChildren<{ value: SpreadSheetModalContextType }>
> = ({ value, children }) => {
  return (
    <SpreadSheetModalContext.Provider value={value}>
      {children}
    </SpreadSheetModalContext.Provider>
  );
};

/* ============================================================================
 * Sub Component: ShopModalFooter (UI)
 * ============================================================================ */
export const ShopModalFooter: React.FC<{ data: Shop }> = React.memo(
  ({ data }) => {
    const { excelPath, pdfPath, handleOpen } = useShopModalFooter(data);

    if (!excelPath && !pdfPath) return null;

    return (
      <>
        {excelPath && (
          <button
            type="button"
            className={styles.button}
            onClick={() => void handleOpen(excelPath)}
          >
            Excel
          </button>
        )}
        {pdfPath && (
          <button
            type="button"
            className={styles.button}
            onClick={() => void handleOpen(pdfPath)}
          >
            PDF
          </button>
        )}
      </>
    );
  },
);

ShopModalFooter.displayName = "ShopModalFooter";

/* ============================================================================
 * Main Component: SpreadSheetModal (UI)
 * ============================================================================ */
export interface SpreadSheetModalProps<K extends SheetId = SheetId> {
  sheetId: K;
  data: SheetRowMap[K];
  title: string;
  onClose: () => void;
}

export const SpreadSheetModal = React.memo(
  <K extends SheetId>({
    sheetId,
    data,
    title,
    onClose,
  }: SpreadSheetModalProps<K>) => {
    const [headerRight, setHeaderRight] = useState<ReactNode>(null);
    const [footerLeft, setFooterLeft] = useState<ReactNode>(null);

    const contextValue = useMemo(
      () => ({
        setHeaderRight,
        setFooterLeft,
        onClose,
      }),
      [onClose],
    );

    const ContentComponent = SPREADSHEET_MODAL_MAP[sheetId] as
      | React.ComponentType<{
          data: SheetRowMap[K];
          title: string;
          onClose: () => void;
        }>
      | undefined;

    return (
      <SpreadSheetModalProvider value={contextValue}>
        <div className={styles.container}>
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <h2 className={styles.modalTitle}>{title}</h2>
            </div>
            <div className={styles.headerRightContainer}>
              {headerRight}
              <CloseButton onClick={onClose} />
            </div>
          </header>

          {/* Center Content */}
          <main className={styles.centerContent}>
            {ContentComponent ? (
              <ContentComponent data={data} title={title} onClose={onClose} />
            ) : null}
          </main>

          {/* Footer */}
          <footer className={styles.actionContainer}>
            <div className={styles.footerLeft}>
              {sheetId === SHEET_IDS.SHOP ? (
                <ShopModalFooter data={data as Shop} />
              ) : (
                footerLeft
              )}
            </div>
            <button type="button" className={styles.button} onClick={onClose}>
              閉じる
            </button>
          </footer>
        </div>
      </SpreadSheetModalProvider>
    );
  },
);

SpreadSheetModal.displayName = "SpreadSheetModal";
