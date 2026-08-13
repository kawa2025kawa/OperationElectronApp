// src/renderer/features/operation/components/modal/summaryModal/useSummaryModalLogic.ts

import type { OperationItem } from "@shared/types/operationType";

const useSummaryModalLogic = (items: OperationItem[]) => ({
  summaryItems: items,
});

export default useSummaryModalLogic;
