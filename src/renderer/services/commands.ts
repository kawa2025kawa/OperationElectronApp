// src/renderer/services/commands.ts

import type { AuthSession } from "@shared/types/auth";
import type {
  JobResult,
  JobStatus,
  OperationItem,
} from "@shared/types/operation";
import type { RdpTarget } from "@shared/types/rdp";
import type { UpdateInfo } from "@shared/types/system";

/**
 * Renderer → Main IPC の一元管理アダプター。
 *
 * 責務:
 * - IPC channel 名の集約
 * - IPC request / response の型付け
 * - Renderer側で利用しやすいAPIへの変換
 *
 * 責務外:
 * - Job実行結果の解釈
 * - Job固有のUI処理
 * - Job固有のビジネスロジック
 */

/* ============================================================================
 * Types
 * ========================================================================== */

/**
 * Script実行時に渡すファイルパス。
 *
 * - 単一ファイル
 * - 複数ファイル
 */
export type ScriptFilePath = string | string[];

/**
 * Gmail下書き作成パラメータ。
 */
export interface CreateGmailDraftParams {
  accessToken: string;
  raw: string;
}

/**
 * Operation Status更新イベントのIPC payload。
 */
interface OperationStatusUpdatedPayload {
  status?: OperationItem;
}

/**
 * Theme変更イベントで許容する値。
 */
export type AppTheme = "dark" | "light";

/* ============================================================================
 * Type Guards
 * ========================================================================== */

/**
 * Operation Status更新イベントのpayloadを検証する。
 */
function isOperationStatusUpdatedPayload(
  payload: unknown,
): payload is OperationStatusUpdatedPayload {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  return "status" in payload;
}

/**
 * Theme値を検証する。
 */
function isAppTheme(value: unknown): value is AppTheme {
  return value === "dark" || value === "light";
}

/* ============================================================================
 * Commands
 * ========================================================================== */

export const commands = {
  // ========================================================================
  // Operation / Polling
  // ========================================================================

  /**
   * Pollingを開始する。
   */
  startPolling: (): Promise<void> => window.electronAPI.invoke("startPolling"),

  /**
   * Pollingを停止する。
   */
  stopPolling: (): Promise<void> => window.electronAPI.invoke("stopPolling"),

  /**
   * Auto Start対象のActive FlagをMainへ同期する。
   */
  setActiveFlags: (flags: Record<string, boolean>): Promise<void> =>
    window.electronAPI.invoke("setActiveFlags", flags),

  /**
   * Job Statusを更新する。
   */
  updateJobStatus: (
    kanriNo: string,
    status: JobStatus,
    comment?: string,
  ): Promise<void> =>
    window.electronAPI.invoke("updateJobStatus", {
      kanriNo,
      status,
      comment,
    }),

  /**
   * 全Job Statusを削除する。
   */
  deleteAllJobStatuses: (): Promise<void> =>
    window.electronAPI.invoke("deleteAllJobStatuses"),

  /**
   * 単一Jobの最新Statusを取得する。
   */
  fetchSingleJobStatus: (kanriNo: string): Promise<OperationItem> =>
    window.electronAPI.invoke("fetchSingleJobStatus", {
      kanriNo,
    }),

  /**
   * Operation対象をMain側へ登録する。
   */
  registerTargets: (items: OperationItem[]): Promise<void> =>
    window.electronAPI.invoke("registerTargets", { items }),

  /**
   * 初期Statusを取得する。
   */
  initializeStatus: (): Promise<Record<string, OperationItem>> =>
    window.electronAPI.invoke("initializeStatus"),

  // ========================================================================
  // Jobs / Scripts
  // ========================================================================

  /**
   * Script / Jobを実行する。
   *
   * Main側のJobRunnerが返すJobResultをそのまま返す。
   *
   * Job固有の結果解釈はこの層では行わない。
   */
  executeScript: (
    scriptId: string,
    filePath?: ScriptFilePath,
  ): Promise<JobResult> =>
    window.electronAPI.invoke("executeScript", {
      scriptId,
      filePath,
    }),

  // ========================================================================
  // RDP
  // ========================================================================

  /**
   * RDP対象一覧を取得する。
   */
  getRdpTargets: (): Promise<RdpTarget[]> =>
    window.electronAPI.invoke("getRdpTargets"),

  /**
   * RDPセッションを開始する。
   */
  startRdpSession: (id: string): Promise<void> =>
    window.electronAPI.invoke("startRdpSession", {
      payload: { id },
    }),

  // ========================================================================
  // Authentication
  // ========================================================================

  /**
   * 保存済みGoogle OAuth Sessionを取得する。
   */
  loadAuthSession: (): Promise<AuthSession | null> =>
    window.electronAPI.invoke("googleAuth:loadSession"),

  /**
   * Google OAuth Loginを実行する。
   */
  login: (): Promise<AuthSession> =>
    window.electronAPI.invoke("googleAuth:login"),

  /**
   * Google OAuth Logoutを実行する。
   */
  logout: (): Promise<void> => window.electronAPI.invoke("googleAuth:logout"),

  // ========================================================================
  // System / File
  // ========================================================================

  /**
   * Tempomaticへファイルをアップロードする。
   */
  tempomaticUploadDocument: (
    filePaths: string[],
    expireDate: string,
  ): Promise<boolean> =>
    window.electronAPI.invoke("tempomatic:uploadDocument", {
      filePaths,
      expireDate,
    }),

  /**
   * Renderer上のFileからElectron側の実ファイルパスを取得する。
   */
  getFilePath: (file: File): string => window.electronAPI.getFilePath(file),

  /**
   * URLまたはファイルパスを外部アプリケーションで開く。
   */
  openExternal: (urlOrPath: string): Promise<void> =>
    window.electronAPI.invoke("openExternal", { urlOrPath }),

  /**
   * Update情報を取得する。
   */
  readUpdateInfo: (): Promise<UpdateInfo | null> =>
    window.electronAPI.invoke("readUpdateInfo"),

  /**
   * Main Windowを表示する。
   */
  showMainWindow: (): Promise<void> =>
    window.electronAPI.invoke("showMainWindow"),

  /**
   * Open Dialogを表示する。
   *
   * 現時点では共有型が存在しないためunknownを維持する。
   */
  showOpenDialog: (options: unknown): Promise<unknown> =>
    window.electronAPI.invoke("showOpenDialog", options),

  // ========================================================================
  // Gmail
  // ========================================================================

  /**
   * Gmail署名を取得する。
   */
  getGmailSignature: (accessToken?: string): Promise<string> =>
    window.electronAPI.invoke("gmail:getSignature", accessToken),

  /**
   * Gmail下書きを作成する。
   */
  createGmailDraft: (params: CreateGmailDraftParams): Promise<void> =>
    window.electronAPI.invoke("gmail:createDraft", params),

  // ========================================================================
  // Events
  // ========================================================================

  /**
   * Operation Status更新イベントを購読する。
   *
   * 戻り値:
   * - unsubscribe関数
   */
  onOperationStatusUpdated: (
    callback: (update: OperationItem) => void,
  ): (() => void) =>
    window.electronAPI.on("operationStatusUpdated", (payload: unknown) => {
      if (!isOperationStatusUpdatedPayload(payload)) {
        return;
      }

      const { status } = payload;

      if (!status) {
        return;
      }

      callback(status);
    }),

  /**
   * Theme変更イベントを購読する。
   */
  onThemeChanged: (callback: (theme: AppTheme) => void): (() => void) =>
    window.electronAPI.on("theme-changed", (theme: unknown) => {
      if (!isAppTheme(theme)) {
        return;
      }

      callback(theme);
    }),

  /**
   * Polling cycle完了イベントを購読する。
   */
  onPollingCycleComplete: (callback: () => void): (() => void) =>
    window.electronAPI.on("polling-cycle-complete", callback),
} as const;
