// src/renderer/features/spreadSheet/components/modal/SpreadSheetModalProvider.tsx
import React from "react";
import {
  SpreadSheetModalContext,
  type SpreadSheetModalContextType,
} from "./SpreadSheetModalContext";

export const SpreadSheetModalProvider: React.FC<{
  value: SpreadSheetModalContextType;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <SpreadSheetModalContext.Provider value={value}>
      {children}
    </SpreadSheetModalContext.Provider>
  );
};
