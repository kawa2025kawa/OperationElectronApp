import { useEffect } from "react";
import { useAppStore } from "@shared/store/index";
import {
  usePollingToastStore,
  type ToastType,
} from "@renderer/components/ui/toast/pollingToastStore";
import { consumeSuppressedSuccessToast } from "@shared/utils/statusToastSuppression";
import type {
  JobStatus,
  OperationItem,
  OperationStatusFields,
} from "@shared/types/operationType";

export type StatusUpdateEventPayload = {
  status: OperationStatusFields & {
    kanriNo: string;
    workName?: string;
    jobId?: string;
  };
};

function getToastType(status: JobStatus): ToastType {
  switch (status) {
    case "success":
      return "success";
    case "error":
      return "error";
    case "running":
    case "scriptRunning":
      return "info";
    default:
      return "warning";
  }
}

export const useStatusToast = (): void => {
  const isPolling = useAppStore((state) => state.isPolling);
  const addToast = usePollingToastStore((state) => state.addToast);

  useEffect(() => {
    if (!isPolling) return;

    const unsubscribe = window.electronAPI.on(
      "operationStatusUpdated",
      (...args: unknown[]) => {
        const eventData = args[0] as StatusUpdateEventPayload | undefined;
        const targetStatus = eventData?.status;

        if (!targetStatus || !targetStatus.status) return;

        const kanriNo = String(targetStatus.kanriNo);

        // 1. Store（OperationTable描画元）のステータスを更新
        useAppStore
          .getState()
          .updateItemStatus(targetStatus as unknown as OperationItem);

        // 2. 手動操作（Enter押下時等）でセットされた抑止フラグがある場合はトースト通知を即破棄
        if (consumeSuppressedSuccessToast(kanriNo)) {
          return;
        }

        const type = getToastType(targetStatus.status);

        // 3. JobID がある場合は JobID、無ければ workName で表示メッセージを作成
        const rawJobId = targetStatus.jobId?.trim();
        const hasJobId = Boolean(rawJobId && rawJobId !== "-");
        const nameLabel = hasJobId
          ? rawJobId
          : (targetStatus.workName ?? `管理No.${targetStatus.kanriNo}`);

        addToast(`${nameLabel} ${targetStatus.status}`, type);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [isPolling, addToast]);
};
