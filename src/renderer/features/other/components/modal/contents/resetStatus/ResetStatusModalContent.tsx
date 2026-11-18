// src/renderer/features/other/components/modal/contents/resetStatus/ResetStatusModalContent.tsx

import { memo } from "react";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import * as scriptStyles from "@renderer/features/operation/components/modal/scriptModal/scriptModalContent.css";
import { useResetStatusModalContent } from "./useResetStatusModalContent";

export const ResetStatusModalContent: GlobalModalComponent = memo(
  function ResetStatusModalContent() {
    const { state } = useResetStatusModalContent();

    return (
      <div className={scriptStyles.contentFlexContainer}>
        <div className={scriptStyles.infoBoxVariants[state.infoMessage.type]}>
          {state.infoMessage.text}
        </div>

        <div className={scriptStyles.mainContainer}>
          <pre className={scriptStyles.rawTextContent}>{state.bodyText}</pre>
        </div>
      </div>
    );
  },
);

ResetStatusModalContent.displayName = "ResetStatusModalContent";