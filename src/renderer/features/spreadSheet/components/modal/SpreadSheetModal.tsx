// src/renderer/features/spreadSheet/components/modal/SpreadSheetModal.tsx

import React, {
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import type { SheetRowMap, Shop } from "@shared/types/spreadsheet";
import { JugyoinModalContent } from "./jugyoin/JugyoinModalContent";
import { KokyuhyoModalContent } from "./kokyuhyo/KokyuhyoModalContent";
import { ShopModalContent } from "./shop/ShopModalContent";
import { TantouModalContent } from "./tantou/TantouModalContent";
import {
  SpreadSheetModalContext,
  type SpreadSheetModalContextType,
} from "./spreadSheetModalContext";
import { useShopModalFooter } from "./hooks/useShopModalFooter";
import * as styles from "./spreadSheetModal.css";

// ----------------------------------------------------
// 型定義 & コンポーネントマップ（旧 modalRegistry.ts を吸収）
// ----------------------------------------------------

type ModalSheetKey = keyof SheetRowMap;

export interface ModalContentProps<T = unknown> {
  data: T;
}

export type ModalComponentMap = {
  [K in ModalSheetKey]: React.ComponentType<ModalContentProps<SheetRowMap[K]>>;
};

export const SPREADSHEET_MODAL_MAP: ModalComponentMap = {
  JugyoinMasterData: JugyoinModalContent,
  KokyuhyoMasterData: KokyuhyoModalContent,
  StoreMasterData: ShopModalContent,
  KokyuhyoTantouMasterData: TantouModalContent,
};

// ----------------------------------------------------
// コンポーネント実装
// ----------------------------------------------------

export const SpreadSheetModalProvider: React.FC<
  PropsWithChildren<{ value: SpreadSheetModalContextType }>
> = ({ value, children }) => {
  return (
    <SpreadSheetModalContext.Provider value={value}>
      {children}
    </SpreadSheetModalContext.Provider>
  );
};

export const ShopModalFooter: React.FC<{ data: Shop }> = React.memo(
  ({ data }) => {
    const { excelPath, pdfPath, handleOpen } = useShopModalFooter(data);

    if (!excelPath && !pdfPath) {
      return null;
    }

    return (
      <>
        {excelPath && (
          <button
            type="button"
            className={styles.button}
            onClick={() => void handleOpen(excelPath)}
          >
            完成図書Excel
          </button>
        )}
        {pdfPath && (
          <button
            type="button"
            className={styles.button}
            onClick={() => void handleOpen(pdfPath)}
          >
            完成図書PDF
          </button>
        )}
      </>
    );
  },
);

ShopModalFooter.displayName = "ShopModalFooter";

export interface SpreadSheetModalProps<
  K extends ModalSheetKey = ModalSheetKey,
> {
  sheetId: K;
  data: SheetRowMap[K];
  title: string;
  onClose: () => void;
}

export const SpreadSheetModal = React.memo(
  <K extends ModalSheetKey>({
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

    const ContentComponent = SPREADSHEET_MODAL_MAP[
      sheetId
    ] as React.ComponentType<{
      data: SheetRowMap[K];
    }>;

    return (
      <SpreadSheetModalProvider value={contextValue}>
        <div className={styles.container}>
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <h2 className={styles.modalTitle}>{title}</h2>
            </div>

            <div className={styles.headerRightContainer}>
              {headerRight}
              <CloseButton onClick={onClose} />
            </div>
          </header>

          <main className={styles.centerContent}>
            {ContentComponent ? <ContentComponent data={data} /> : null}
          </main>

          <footer className={styles.actionContainer}>
            <div className={styles.footerLeft}>
              {sheetId === "StoreMasterData" ? (
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
