// src/renderer/features/other/components/modal/contents/statusSync/StatusSyncModalContent.tsx

import { memo, useEffect, useState } from "react";
import { SegmentedControl } from "@renderer/components/ui/toggle/SegmentedControl";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import * as styles from "./statusSyncModal.css";
import {
  useStatusSyncLoad,
  useStatusSyncSave,
  type StatusSyncMode,
} from "./useStatusSyncModalContent";

type StatusSyncModalContentProps = Record<string, never>;

const MODE_ITEMS = [
  { id: "save", label: "SAVE" },
  { id: "load", label: "LOAD" },
] as const;

const SaveModeBody = memo(function SaveModeBody({
  onLockChange,
}: {
  onLockChange: (locked: boolean) => void;
}) {
  const {
    operatorName,
    currentTimeText,
    handoverNote,
    setHandoverNote,
    isLocked,
    infoMessage,
  } = useStatusSyncSave();

  useEffect(() => {
    onLockChange(isLocked);
  }, [isLocked, onLockChange]);

  return (
    <>
      <div className={styles.infoBoxVariants[infoMessage.type]}>
        {infoMessage.text}
      </div>

      <div className={styles.infoGrid}>
        <span className={styles.label}>担当者名</span>
        <span className={styles.value}>{operatorName}</span>

        <span className={styles.label}>保存日時</span>
        <span className={styles.value}>{currentTimeText}</span>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="handover-note-input">
          引き継ぎ事項
        </label>
        <textarea
          id="handover-note-input"
          className={styles.textarea}
          value={handoverNote}
          onChange={(e) => setHandoverNote(e.target.value)}
          disabled={isLocked}
          placeholder="未完了の作業、注意事項、次に対応する内容などを入力"
        />
      </div>
    </>
  );
});

const LoadModeBody = memo(function LoadModeBody({
  onLockChange,
}: {
  onLockChange: (locked: boolean) => void;
}) {
  const { isLoadingPreview, preview, isLocked, infoMessage } =
    useStatusSyncLoad();

  useEffect(() => {
    onLockChange(isLocked);
  }, [isLocked, onLockChange]);

  return (
    <>
      <div className={styles.infoBoxVariants[infoMessage.type]}>
        {infoMessage.text}
      </div>

      {isLoadingPreview ? (
        <div className={styles.noteBox}>前回の保存情報を読み込み中...</div>
      ) : !preview?.hasData ? (
        <div className={styles.noteBox}>
          保存されている引き継ぎデータが見つかりませんでした。
        </div>
      ) : (
        <>
          <div className={styles.infoGrid}>
            <span className={styles.label}>前回の担当者</span>
            <span className={styles.value}>
              {preview.metadata?.operatorName || "（未記録）"}
            </span>

            <span className={styles.label}>前回の保存日時</span>
            <span className={styles.value}>
              {preview.metadata?.savedAt || "（未記録）"}
            </span>
          </div>

          <div className={styles.fieldGroup}>
            <span className={styles.label}>引き継ぎ事項</span>
            <div className={styles.noteBox}>
              {preview.metadata?.handoverNote?.trim()
                ? preview.metadata.handoverNote
                : "（引き継ぎ事項の記載はありません）"}
            </div>
          </div>
        </>
      )}
    </>
  );
});

export const StatusSyncModalContent: GlobalModalComponent<StatusSyncModalContentProps> =
  memo(function StatusSyncModalContent() {
    const [mode, setMode] = useState<StatusSyncMode>("save");
    const [isLocked, setIsLocked] = useState(false);

    return (
      <div className={styles.container}>
        <div className={styles.modeHeader}>
          <div
            className={
              isLocked
                ? styles.modeToggleWrapperDisabled
                : styles.modeToggleWrapper
            }
          >
            <SegmentedControl
              id="status-sync-mode"
              items={MODE_ITEMS}
              value={mode}
              onChange={(nextMode) => {
                if (!isLocked) {
                  setMode(nextMode);
                }
              }}
              size="md"
              fullWidth={false}
            />
          </div>
        </div>

        {mode === "save" ? (
          <SaveModeBody onLockChange={setIsLocked} />
        ) : (
          <LoadModeBody onLockChange={setIsLocked} />
        )}
      </div>
    );
  });

StatusSyncModalContent.displayName = "StatusSyncModalContent";
