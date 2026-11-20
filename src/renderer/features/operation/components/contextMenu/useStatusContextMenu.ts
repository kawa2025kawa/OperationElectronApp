// src/renderer/features/operation/components/contextMenu/useStatusContextMenu.ts

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useAppStore } from "@renderer/store";
import {
  JOB_STATUS,
  JOB_STATUS_LABEL,
  type JobStatus,
} from "@shared/types/operation/operationTypes";

const PRIMARY_ROW_STATUSES = [
  JOB_STATUS.SCHEDULED,
  JOB_STATUS.RUNNING,
  JOB_STATUS.SCRIPT_RUNNING,
  JOB_STATUS.SUCCESS,
] as const satisfies readonly JobStatus[];

const SECONDARY_ROW_STATUSES = [
  JOB_STATUS.READY,
  JOB_STATUS.WAITING,
  JOB_STATUS.NEEDS_ACTION,
  JOB_STATUS.ERROR,
] as const satisfies readonly JobStatus[];

export interface StatusMenuOption {
  readonly status: JobStatus;
  readonly label: string;
  readonly isCurrent: boolean;
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

  const primaryItems = useMemo<StatusMenuOption[]>(
    () =>
      PRIMARY_ROW_STATUSES.map((status) => ({
        status,
        label: JOB_STATUS_LABEL[status],
        isCurrent: currentStatus === status,
      })),
    [currentStatus],
  );

  const secondaryItems = useMemo<StatusMenuOption[]>(
    () =>
      SECONDARY_ROW_STATUSES.map((status) => ({
        status,
        label: JOB_STATUS_LABEL[status],
        isCurrent: currentStatus === status,
      })),
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