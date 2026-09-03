import { createContext, useContext, type ReactNode } from "react";

export interface SpreadSheetModalContextType {
  setHeaderRight: (node: ReactNode) => void;
  setFooterLeft: (node: ReactNode) => void;
  onClose: () => void;
}

export const SpreadSheetModalContext =
  createContext<SpreadSheetModalContextType | null>(null);

export const useSpreadSheetModalContext = (): SpreadSheetModalContextType => {
  const ctx = useContext(SpreadSheetModalContext);
  if (!ctx) {
    throw new Error(
      "useSpreadSheetModalContext must be used within a SpreadSheetModalProvider",
    );
  }
  return ctx;
};
