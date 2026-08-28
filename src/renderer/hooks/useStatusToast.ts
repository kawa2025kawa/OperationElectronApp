import { useEffect } from "react";
import { useAppStore } from "@shared/store/index";
import { commands } from "@shared/service/commands";
import {
  usePollingToastStore,
  type ToastType,
} from "@renderer/components/ui/toast/pollingToastStore";
import { consumeSuppressedSuccessToast } from "@shared/utils/statusToastSuppression";
import type { JobStatus, OperationItem } from "@shared/types/operationType";

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

    const cleanup = commands.onOperationStatusUpdated(
      (update: OperationItem) => {
        if (!update || !update.status) return;

        const kanriNo = String(update.kanriNo);

        // 1. Store（OperationTable描画元）のステータスを更新
        useAppStore.getState().updateItemStatus(update);

        // 2. 手動操作（Enter押下時等）でセットされた抑止フラグがある場合はトースト通知を即破棄
        if (consumeSuppressedSuccessToast(kanriNo)) {
          return;
        }

        const type = getToastType(update.status);

        // 3. JobID がある場合は JobID、無ければ workName で表示メッセージを作成
        const rawJobId =
          "jobId" in update && typeof update.jobId === "string"
            ? update.jobId.trim()
            : undefined;
        const hasJobId = Boolean(rawJobId && rawJobId !== "-");
        const nameLabel = hasJobId
          ? rawJobId
          : (update.workName ?? `管理No.${update.kanriNo}`);

        addToast(`${nameLabel} ${update.status}`, type);
      },
    );

    return () => {
      cleanup();
    };
  }, [isPolling, addToast]);
};
