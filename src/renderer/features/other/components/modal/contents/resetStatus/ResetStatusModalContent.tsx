// src/renderer/features/other/components/modal/contents/resetStatus/ResetStatusModalContent.tsx

import { memo } from "react";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import { useResetStatusModalContent } from "./useResetStatusModalContent";

export const ResetStatusModalContent: GlobalModalComponent = memo(() => {
  useResetStatusModalContent();

  return (
    <div style={{ padding: "16px 0", textAlign: "center", fontSize: "20px" }}>
      すべてのステータスを初期化（未実行）に戻しますか？
    </div>
  );
});

ResetStatusModalContent.displayName = "ResetStatusModalContent";
