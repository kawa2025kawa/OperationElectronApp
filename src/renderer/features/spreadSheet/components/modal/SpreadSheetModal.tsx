// src/renderer/features/spreadSheet/components/modal/SpreadSheetModal.tsx
import React, { useMemo, useState } from "react";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import type { SheetId, SheetRowMap } from "@shared/types/spreadsheetTypes";
import { SPREADSHEET_MODAL_MAP } from "./modalRegistry";
import { SpreadSheetModalProvider } from "./SpreadSheetModalProvider";
import * as styles from "./SpreadSheetModal.css";

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
    const [headerRight, setHeaderRight] = useState<React.ReactNode>(null);

    const contextValue = useMemo(
      () => ({
        setHeaderRight,
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
