// src/renderer/features/other/components/modal/contents/statusSync/StatusSyncModalContent.tsx

import { memo, useState } from "react";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import * as styles from "./statusSyncModal.css";
import {
  useStatusSyncLoad,
  useStatusSyncSave,
  type StatusSyncInfoMessage,
  type StatusSyncMode,
} from "./useStatusSyncModalContent";

export type { StatusSyncMode };

type StatusSyncModalContentProps = Record<string, never>;

interface ModeHeaderProps {
  mode: StatusSyncMode;
  disabled: boolean;
  onModeChange: (mode: StatusSyncMode) => void;
}

const StatusSyncLayout = memo(function StatusSyncLayout({
  infoMessage,
  mode,
  disabled,
  onModeChange,
  children,
}: ModeHeaderProps & {
  infoMessage: StatusSyncInfoMessage;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      <div className={styles.infoBoxVariants[infoMessage.type]}>
        {infoMessage.text}
      </div>

      <div className={styles.modeHeader}>
        <div className={styles.modeToggle}>
          {(["save", "load"] as const).map((targetMode) => {
            const isActive = mode === targetMode;
            return (
              <button
                key={targetMode}
                type="button"
                className={`${styles.modeToggleButton} ${
                  isActive ? styles.modeToggleButtonActive : ""
                }`}
                onClick={() => onModeChange(targetMode)}
                disabled={disabled || isActive}
              >
                {targetMode.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {children}
    </div>
  );
});

const SaveModeContent = memo(function SaveModeContent({
  onModeChange,
}: {
  onModeChange: (mode: StatusSyncMode) => void;
}) {
  const {
    operatorName,
    currentTimeText,
    handoverNote,
    setHandoverNote,
    isLocked,
    infoMessage,
  } = useStatusSyncSave();

  return (
    <StatusSyncLayout
      infoMessage={infoMessage}
      mode="save"
      disabled={isLocked}
      onModeChange={onModeChange}
    >
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
    </StatusSyncLayout>
  );
});

const LoadModeContent = memo(function LoadModeContent({
  onModeChange,
}: {
  onModeChange: (mode: StatusSyncMode) => void;
}) {
  const { isLoadingPreview, preview, isLocked, infoMessage } =
    useStatusSyncLoad();

  return (
    <StatusSyncLayout
      infoMessage={infoMessage}
      mode="load"
      disabled={isLocked}
      onModeChange={onModeChange}
    >
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
    </StatusSyncLayout>
  );
});

export const StatusSyncModalContent: GlobalModalComponent<StatusSyncModalContentProps> =
  memo(function StatusSyncModalContent() {
    const [mode, setMode] = useState<StatusSyncMode>("save");

    return mode === "save" ? (
      <SaveModeContent onModeChange={setMode} />
    ) : (
      <LoadModeContent onModeChange={setMode} />
    );
  });

StatusSyncModalContent.displayName = "StatusSyncModalContent";
