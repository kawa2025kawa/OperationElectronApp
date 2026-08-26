import { createContext, useContext } from "react";
import type { RegisterPrimaryAction } from "./useOperationModalLogic";

export interface OperationModalContextType {
  kanriNo?: string;
  setTitle: (title: string) => void;
  registerPrimaryAction: RegisterPrimaryAction;
  onClose: () => void;
}

export const OperationModalContext =
  createContext<OperationModalContextType | null>(null);

export const useOperationModalContext = (): OperationModalContextType => {
  const ctx = useContext(OperationModalContext);
  if (!ctx) {
    throw new Error(
      "useOperationModalContext must be used within an OperationModalProvider",
    );
  }
  return ctx;
};
