// src/renderer/features/app/actions.ts

import { useAppStore } from "@shared/store";
import type {
  JobDependenciesJson,
  OperationItem,
} from "@shared/types/operationType";
import { unwrapResult } from "@shared/utils/apiUtils";

import irregularData from "@resources/json/irregularData.json";
import jobDependenciesData from "@resources/json/jobDependencies.json";
import operationData from "@resources/json/operationData.json";

const normalizeOperationItem = (
  item: Record<string, unknown>,
): OperationItem => ({
  kanriNo: String(item.kanriNo ?? ""),
  workName: String(item.workName ?? ""),

  jobId: (item.jobId as string | null | undefined) ?? null,
  scheduledTime: (item.scheduledTime as string | null | undefined) ?? null,
  kanshiTime: (item.kanshiTime as string | null | undefined) ?? null,

  manual: (item.manual as boolean | null | undefined) ?? null,
  script: (item.script as boolean | null | undefined) ?? null,
  autoStart: (item.autoStart as boolean | null | undefined) ?? null,
  requiresFile: (item.requiresFile as boolean | null | undefined) ?? null,

  link: (item.link as Record<string, string> | null | undefined) ?? null,
  url: (item.url as Record<string, string> | null | undefined) ?? null,

  cycle1: (item.cycle1 as string | null | undefined) ?? null,
  cycle2: (item.cycle2 as string | null | undefined) ?? null,

  type: (item.type as string | null | undefined) ?? null,

  status: (item.status as OperationItem["status"]) ?? null,

  comment: (item.comment as string | null | undefined) ?? null,

  startTime: (item.startTime as string | null | undefined) ?? null,
  endTime: (item.endTime as string | null | undefined) ?? null,

  expectedStartTime:
    (item.expectedStartTime as string | null | undefined) ?? null,

  expectedEndTime: (item.expectedEndTime as string | null | undefined) ?? null,

  substatus: (item.substatus as string[] | null | undefined) ?? null,

  info: (item.info as string | null | undefined) ?? null,
});

const normalizeOperationList = (data: unknown[]): OperationItem[] =>
  data.map((item) => normalizeOperationItem(item as Record<string, unknown>));

const handleInitError = (error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error);

  console.error("[App] Failed to initialize app:", message);

  const store = useAppStore.getState();

  store.setIsAuthenticated(false);
  store.setAccessToken(null);

  const newStatus = { ...store.initStatus };

  (Object.keys(newStatus) as Array<keyof typeof newStatus>).forEach((key) => {
    if (newStatus[key] !== "OK" && newStatus[key] !== "CONNECTED") {
      newStatus[key] = "NG";
    }
  });

  store.setInitStatus(newStatus);
};

export const initializeAppAction = async (): Promise<void> => {
  const store = useAppStore.getState();

  store.setIsLoading(true);

  try {
    try {
      if (window.electronAPI.showWindow) {
        await window.electronAPI.showWindow();
      } else {
        await window.electronAPI.invoke("showMainWindow");
      }
    } catch (error) {
      console.error("[App] Failed to show window:", error);
    }

    store.setInitStatus({
      operation: "LOADING",
      irregular: "LOADING",
      auth: "LOADING",
      store: "LOADING",
      jugyoin: "LOADING",
      kokyuhyo: "LOADING",
      tantou: "LOADING",
    });

    const [isAuthenticated, statusesResponse] = await Promise.all([
      store.checkAuthStatus(),
      window.electronAPI.invoke<unknown>("initializeStatuses"),
    ]);

    const rawStatuses = unwrapResult(
      statusesResponse,
      "Failed to initialize statuses",
    ) as Record<string, unknown>;

    const statuses = Object.fromEntries(
      Object.entries(rawStatuses).map(([key, value]) => [
        key,
        normalizeOperationItem(value as Record<string, unknown>),
      ]),
    );

    const operations = normalizeOperationList(operationData as unknown[]);

    const irregulars = normalizeOperationList(irregularData as unknown[]);

    const jobDependencies = jobDependenciesData as JobDependenciesJson;

    const allTargets = [...operations, ...irregulars].filter((item) =>
      Boolean(item.kanriNo),
    );

    // 修正箇所: "register-targets" を "registerTargets" に変更
    const registerPromise = window.electronAPI
      .invoke<unknown>("registerTargets", allTargets)
      .then((result) => {
        unwrapResult(result, "Failed to register targets in Electron");
      });

    const sheetsPromise = (async () => {
      if (isAuthenticated) {
        store.setInitStatus({
          auth: "OK",
        });

        const token = useAppStore.getState().accessToken;

        await store.prefetchSheets(token || undefined);

        return;
      }

      store.setInitStatus({
        auth: "PENDING",
        store: "PENDING",
        jugyoin: "PENDING",
        kokyuhyo: "PENDING",
        tantou: "PENDING",
      });
    })();

    await Promise.all([registerPromise, sheetsPromise]);

    store.setInitialRawData(operations, irregulars, statuses, jobDependencies);

    store.setInitStatus({
      operation: "OK",
      irregular: "OK",
    });

    store.setIsInitialLoaded(true);
  } catch (error) {
    handleInitError(error);
    throw error;
  } finally {
    store.setIsLoading(false);
  }
};
