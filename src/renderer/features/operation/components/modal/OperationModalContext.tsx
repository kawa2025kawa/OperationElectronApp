// src/renderer/features/operation/components/modal/OperationModalContext.tsx

import { createContext, useContext } from "react";

import type { RegisterPrimaryAction } from "./useOperationModalLogic";

// ============================================================================
// Types
// ============================================================================

export interface OperationModalContextType {
  kanriNo?: string;
  setTitle: (title: string) => void;
  registerPrimaryAction: RegisterPrimaryAction;
  onClose: () => void;
}

// ============================================================================
// Context
// ============================================================================

export const OperationModalContext =
  createContext<OperationModalContextType | null>(null);

// ============================================================================
// Hook
// ============================================================================

export function useOperationModalContext(): OperationModalContextType {
  const context = useContext(OperationModalContext);

  if (!context) {
    throw new Error(
      "useOperationModalContext must be used within an OperationModalProvider",
    );
  }

  return context;
}
