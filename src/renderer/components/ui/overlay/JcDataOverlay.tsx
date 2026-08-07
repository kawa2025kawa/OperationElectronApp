// src\renderer\components\ui\overlay\JcDataOverlay.tsx
import React from "react";
import type { OperationItem } from "@shared/types/operationType";
import type { InitStatus } from "@shared/types/initializationTypes";
import * as styles from "./jcDataOverlay.css";

export interface JcDataOverlayProps {
  isOpen: boolean;
  item: OperationItem | undefined;
  onClose: () => void;
  onExecute: () => void;
  isSuccess?: boolean;
  isExecuting?: boolean;
  message?: string;
  statusMessage?: string;
  dataStatus?: InitStatus;
}

const PANEL_LABELS: Record<keyof InitStatus, string> = {
  operation: "Operation Data",
  irregular: "Irregular Data",
  auth: "Google Auth",
  store: "Store Master",
  jugyoin: "Staff Master",
  kokyuhyo: "Schedule Data",
  tantou: "Duty Roster",
};

const JcDataOverlayComponent: React.FC<JcDataOverlayProps> = ({
  isOpen,
  item,
  onClose,
  onExecute,
  isSuccess = false,
  isExecuting = false,
  message = "TASK CONFIRMATION",
  statusMessage = "WAITING FOR USER INPUT...",
  dataStatus,
}) => {
  // 🎯 TypeScript の型エラー回避: Record<string, any> として安全にプロパティアクセス
  const infoRows = React.useMemo(() => {
    if (!item) return [];

    // 一旦 unknown にキャストしてから型アクセスを許可
    const target = item as unknown as Record<string, unknown>;

    // プロパティが存在する場合は採用、存在しない場合は別の候補や '-' を代入
    const idVal = target.id ?? target.kanriNo ?? target.manageNo ?? "-";
    const jobNameVal =
      target.jobName ?? target.workName ?? target.title ?? target.name ?? "-";
    const memoVal = target.memo ?? target.note ?? target.remark ?? "-";

    return [
      { label: "管理番号", value: String(idVal) },
      { label: "JOB ID", value: String(target.jobId ?? "-") },
      { label: "作業名", value: String(jobNameVal) },
      { label: "ステータス", value: String(target.status ?? "-") },
      { label: "開始日時", value: String(target.startTime ?? "-") },
      { label: "終了日時", value: String(target.endTime ?? "-") },
      { label: "備考", value: String(memoVal) },
    ];
  }, [item]);

  return (
    <div
      className={`${styles.backdropBase} ${styles.backdropStates[isOpen ? "open" : "closed"]}`}
    >
      <div className={styles.scanline} />

      <div className={styles.contentWrapper}>
        <div className={styles.content}>
          <div className={styles.title}>
            {isExecuting
              ? "EXECUTING TASK..."
              : isSuccess
                ? "TASK COMPLETED"
                : message}
          </div>

          <div className={styles.status}>
            {isSuccess
              ? "✓ PROCESS COMPLETED SUCCESSFULLY."
              : isExecuting
                ? "GETTING LATEST JOB STATUS..."
                : statusMessage}
          </div>

          {isExecuting && (
            <div className={styles.dots}>
              <span className={styles.dot} style={{ animationDelay: "0s" }} />
              <span className={styles.dot} style={{ animationDelay: "0.2s" }} />
              <span className={styles.dot} style={{ animationDelay: "0.4s" }} />
            </div>
          )}

          {/* グリッド表示 */}
          <div className={styles.gridContainer}>
            {infoRows.map((row) => (
              <div key={row.label} className={styles.gridItem}>
                <span className={styles.gridItemLabel}>{row.label}</span>
                <span className={styles.gridItemValue}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* ボタン群 */}
          <div className={styles.buttonGroup}>
            {!isSuccess && (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={onClose}
                disabled={isExecuting}
              >
                CANCEL
              </button>
            )}
            <button
              type="button"
              className={styles.primaryButton}
              onClick={isSuccess ? onClose : onExecute}
              disabled={isExecuting}
            >
              {isExecuting && <div className={styles.buttonSpinner} />}
              <span>
                {isExecuting ? "RUNNING..." : isSuccess ? "OK" : "EXECUTE"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 右下ステータスログ */}
      {dataStatus && (
        <div className={styles.statusPanel}>
          {(Object.entries(dataStatus) as [keyof InitStatus, string][]).map(
            ([key, value]) => {
              const isOk = value === "OK" || value === "CONNECTED";
              const isLoading = value === "LOADING";
              const statusTone = isOk
                ? styles.tone.ok
                : isLoading
                  ? styles.tone.info
                  : styles.tone.ng;

              return (
                <div className={styles.statusRow} key={String(key)}>
                  <span>{PANEL_LABELS[key]}:</span>
                  <span className={statusTone}>{value}</span>
                </div>
              );
            },
          )}
        </div>
      )}
    </div>
  );
};

export const JcDataOverlay = React.memo(JcDataOverlayComponent);
export default JcDataOverlay;
