// src/renderer/features/operation/components/contextMenu/useStatusContextMenu.ts

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { normalizeDisplayStatus } from "@renderer/features/operation/utils/operationDisplayUtils";
import { useAppStore } from "@renderer/store";
import { JOB_STATUS_LABEL } from "@renderer/styles/tokens/statusTheme";
import {
  JOB_STATUS,
  type JobStatus,
} from "@shared/types/operation/operationTypes";

const PRIMARY_ROW_STATUSES = [
  JOB_STATUS.SUCCESS,
  JOB_STATUS.RUNNING,
  JOB_STATUS.READY,
] as const satisfies readonly JobStatus[];

const SECONDARY_ROW_STATUSES = [
  JOB_STATUS.SCHEDULED,
  JOB_STATUS.NEEDS_ACTION,
  JOB_STATUS.ERROR,
] as const satisfies readonly JobStatus[];

export interface StatusMenuOption {
  readonly status: JobStatus;
  readonly label: string;
  readonly isCurrent: boolean;
}

function toStatusMenuOptions(
  statuses: readonly JobStatus[],
  currentStatus?: JobStatus,
): StatusMenuOption[] {
  const normalizedCurrent = normalizeDisplayStatus(currentStatus);
  return statuses.map((status) => ({
    status,
    label: JOB_STATUS_LABEL[status],
    isCurrent: normalizedCurrent === status,
  }));
}

export function useStatusContextMenu(
  kanriNo: string | null,
  workName?: string,
  currentStatus?: JobStatus,
) {
  const updateOperationStatus = useAppStore(
    (state) => state.updateOperationStatus,
  );

  const kanriNoRef = useRef(kanriNo);
  useLayoutEffect(() => {
    kanriNoRef.current = kanriNo;
  }, [kanriNo]);

  const handleSelectStatus = useCallback(
    (status: JobStatus) => {
      const targetKanriNo = kanriNoRef.current;
      if (!targetKanriNo) return;

      updateOperationStatus({
        kanriNo: targetKanriNo,
        status,
        comment: "",
      });
    },
    [updateOperationStatus],
  );

  const primaryItems = useMemo(
    () => toStatusMenuOptions(PRIMARY_ROW_STATUSES, currentStatus),
    [currentStatus],
  );

  const secondaryItems = useMemo(
    () => toStatusMenuOptions(SECONDARY_ROW_STATUSES, currentStatus),
    [currentStatus],
  );

  const headerKanriNo = kanriNo ? `No.${kanriNo}` : "";
  const headerWorkName = workName || headerKanriNo;

  return {
    headerKanriNo,
    headerWorkName,
    primaryItems,
    secondaryItems,
    handleSelectStatus,
  };
}
