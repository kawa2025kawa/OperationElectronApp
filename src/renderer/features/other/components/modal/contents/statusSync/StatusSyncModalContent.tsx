// src/renderer/features/other/components/modal/contents/statusSync/StatusSyncModalContent.tsx

import { memo, useEffect, useMemo, useState } from "react";
import {
  CenterId,
  DEFAULT_ACTIVE_FLAGS,
  type ActiveFlags,
} from "@shared/types/operation/operationTypes";
import type { GlobalModalComponent, ModalAction } from "@shared/types/ui/modal";
import { useAppStore } from "@renderer/store";
import * as styles from "./statusSyncModal.css";
import {
  useStatusSyncModalContent,
  type StatusSyncMode,
} from "./useStatusSyncModalContent";

export type { StatusSyncMode };

type StatusSyncModalContentProps = Record<string, never>;

const FLAG_KEY_BY_CENTER: Record<CenterId, keyof ActiveFlags> = {
  "1C": "is1CActive",
  "2C": "is2CActive",
  "3C": "is3CActive",
};

const ActiveFlagsBadges = memo(({ flags }: { flags: ActiveFlags }) => (
  <div className={styles.flagBadgeGroup}>
    {CenterId.VALUES.map((center) => {
      const isActive = flags[FLAG_KEY_BY_CENTER[center]];

      return (
        <span
          key={center}
          className={
            isActive ? styles.flagBadgeActive : styles.flagBadgeInactive
          }
        >
          {center}: {isActive ? "ON" : "OFF"}
        </span>
      );
    })}
  </div>
));

ActiveFlagsBadges.displayName = "ActiveFlagsBadges";

const StatusSyncModeContent = memo(
  ({
    mode,
    onModeChange,
  }: {
    mode: StatusSyncMode;
    onModeChange: (mode: StatusSyncMode) => void;
  }) => {
    const { state, actions } = useStatusSyncModalContent(mode);
    const updateModalConfig = useAppStore((s) => s.updateModalConfig);

    const rightActions = useMemo<ModalAction[]>(() => {
      if (state.isFinished) {
        return [];
      }

      const executeLabel = state.isSave
        ? state.isExecuting
          ? "保存中..."
          : "SAVE"
        : state.isExecuting
          ? "読込中..."
          : "LOAD";

      return [
        {
          id: "cancel",
          label: "キャンセル",
          onClick: actions.handleClose,
          disabled: state.isExecuting,
        },
        {
          id: "execute",
          label: executeLabel,
          onClick: actions.handleExecute,
          disabled: state.isExecuteDisabled || state.isExecuting,
          variant: "default",
        },
      ];
    }, [
      state.isFinished,
      state.isSave,
      state.isExecuting,
      state.isExecuteDisabled,
      actions.handleClose,
      actions.handleExecute,
    ]);

    useEffect(() => {
      updateModalConfig({
        isProcessing: state.isExecuting,
        rightActions,
      });
    }, [state.isExecuting, rightActions, updateModalConfig]);

    return (
      <div className={styles.container}>
        <div className={styles.infoBoxVariants[state.infoMessage.type]}>
          {state.infoMessage.text}
        </div>

        <div className={styles.modeHeader}>
          <div className={styles.modeToggle}>
            <button
              type="button"
              className={`${styles.modeToggleButton} ${
                state.isSave ? styles.modeToggleButtonActive : ""
              }`}
              onClick={() => onModeChange("save")}
              disabled={state.isExecuting || state.isFinished || state.isSave}
            >
              SAVE
            </button>

            <button
              type="button"
              className={`${styles.modeToggleButton} ${
                !state.isSave ? styles.modeToggleButtonActive : ""
              }`}
              onClick={() => onModeChange("load")}
              disabled={state.isExecuting || state.isFinished || !state.isSave}
            >
              LOAD
            </button>
          </div>
        </div>

        {state.isSave ? (
          <>
            <div className={styles.infoGrid}>
              <span className={styles.label}>担当者名</span>
              <span className={styles.value}>{state.operatorName}</span>

              <span className={styles.label}>保存日時</span>
              <span className={styles.value}>{state.currentTimeText}</span>

              <span className={styles.label}>有効フラグ</span>
              <ActiveFlagsBadges flags={state.currentActiveFlags} />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="handover-note-input">
                引き継ぎ事項
              </label>
              <textarea
                id="handover-note-input"
                className={styles.textarea}
                value={state.handoverNote}
                onChange={(e) => actions.setHandoverNote(e.target.value)}
                disabled={state.isExecuting || state.isFinished}
                placeholder="未完了の作業、注意事項、次に対応する内容などを入力"
              />
            </div>
          </>
        ) : (
          <>
            {state.isLoadingPreview ? (
              <div className={styles.noteBox}>
                前回の保存情報を読み込み中...
              </div>
            ) : !state.preview?.hasData ? (
              <div className={styles.noteBox}>
                保存されている引き継ぎデータが見つかりませんでした。
              </div>
            ) : (
              <>
                <div className={styles.infoGrid}>
                  <span className={styles.label}>前回の担当者</span>
                  <span className={styles.value}>
                    {state.preview.metadata?.operatorName || "（未記録）"}
                  </span>

                  <span className={styles.label}>前回の保存日時</span>
                  <span className={styles.value}>
                    {state.preview.metadata?.savedAt || "（未記録）"}
                  </span>

                  <span className={styles.label}>前回の有効フラグ</span>
                  <ActiveFlagsBadges
                    flags={
                      state.preview.metadata?.activeFlags ??
                      DEFAULT_ACTIVE_FLAGS
                    }
                  />

                  <span className={styles.label}>現在の確認日時</span>
                  <span className={styles.subDateValue}>
                    {state.loadScreenOpenedAt}
                  </span>
                </div>

                <div className={styles.fieldGroup}>
                  <span className={styles.label}>引き継ぎ事項</span>
                  <div className={styles.noteBox}>
                    {state.preview.metadata?.handoverNote?.trim()
                      ? state.preview.metadata.handoverNote
                      : "（引き継ぎ事項の記載はありません）"}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    );
  },
);

StatusSyncModeContent.displayName = "StatusSyncModeContent";

export const StatusSyncModalContent: GlobalModalComponent<StatusSyncModalContentProps> =
  memo(function StatusSyncModalContent() {
    const [mode, setMode] = useState<StatusSyncMode>("save");

    return (
      <StatusSyncModeContent key={mode} mode={mode} onModeChange={setMode} />
    );
  });

StatusSyncModalContent.displayName = "StatusSyncModalContent";
