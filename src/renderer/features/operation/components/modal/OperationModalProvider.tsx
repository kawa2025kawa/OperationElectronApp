import React from "react";
import {
  OperationModalContext,
  type OperationModalContextType,
} from "./OperationModalContext";

export const OperationModalProvider: React.FC<{
  value: OperationModalContextType;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <OperationModalContext.Provider value={value}>
      {children}
    </OperationModalContext.Provider>
  );
};
