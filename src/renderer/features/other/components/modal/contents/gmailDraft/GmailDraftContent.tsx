// src/renderer/features/other/components/modal/contents/gmailDraft/GmailDraftContent.tsx

import React, { useEffect } from "react";
import { ActionButton } from "@renderer/components/ui/button/actionButton/ActionButton";
import { AuthView } from "@renderer/features/auth/AuthView";
import { useAppStore } from "@renderer/store";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import * as styles from "./gmailDraftContent.css";
import {
  EMAIL_TEMPLATE_OPTIONS,
  type EmailTemplateOption,
} from "./gmailTemplates";
import { useGmailModalLogic } from "./useGmailModalLogic";

export const GmailDraftContent: GlobalModalComponent = React.memo(() => {
  const {
    isAuthenticated,
    userEmail,
    templateKey,
    formValues,
    isSaving,
    handleInputChange,
    handleTemplateChange,
    handleExecute,
  } = useGmailModalLogic();

  const updateModalConfig = useAppStore((s) => s.updateModalConfig);
  const closeModal = useAppStore((s) => s.closeGlobalModal);

  // 🎯 認証状態に応じてフッター領域を制御
  useEffect(() => {
    if (!isAuthenticated) {
      // 🎯 未認証時は「閉じる」ボタン単体をフッターに配置
      updateModalConfig({
        hideFooter: false,
        footerContent: (
          <ActionButton variant="default" onClick={closeModal}>
            閉じる
          </ActionButton>
        ),
      });
      return;
    }

    // 🎯 認証済みの場合は「キャンセル」と「下書き作成」ボタンを注入
    updateModalConfig({
      hideFooter: false,
      footerContent: (
        <>
          <ActionButton
            variant="default"
            onClick={closeModal}
            disabled={isSaving}
          >
            キャンセル
          </ActionButton>
          <ActionButton
            variant="default"
            onClick={handleExecute}
            disabled={!formValues.to.trim() || isSaving}
          >
            {isSaving ? "処理中..." : "下書き作成"}
          </ActionButton>
        </>
      ),
    });
  }, [
    isAuthenticated,
    formValues.to,
    isSaving,
    handleExecute,
    updateModalConfig,
    closeModal,
  ]);

  // 🎯 未認証時はモーダル埋め込み（embedded）で AuthView を表示
  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <div className={styles.formContainer}>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="gmail-template">
          テンプレート選択
        </label>
        <select
          id="gmail-template"
          className={styles.selectInput}
          value={templateKey ?? ""}
          onChange={handleTemplateChange}
          disabled={isSaving}
        >
          <option value="">手動作成（テンプレートなし）</option>
          {EMAIL_TEMPLATE_OPTIONS.map((option: EmailTemplateOption) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="gmail-from">
          差出人 (From)
        </label>
        <input
          id="gmail-from"
          type="text"
          className={styles.input}
          value={userEmail || "me"}
          disabled
        />
      </div>

      {/* 宛先 (To) */}
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="gmail-to">
          宛先 (To)
        </label>
        <textarea
          id="gmail-to"
          className={styles.addressTextarea} // 🎯 修正: addressTextarea を適用
          rows={1}
          placeholder="example@domain.com"
          value={formValues.to}
          onChange={handleInputChange("to")}
          disabled={isSaving}
        />
      </div>

      {/* CC */}
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="gmail-cc">
          CC
        </label>
        <textarea
          id="gmail-cc"
          className={styles.addressTextarea} // 🎯 修正: addressTextarea を適用
          rows={1}
          placeholder="cc@domain.com"
          value={formValues.cc}
          onChange={handleInputChange("cc")}
          disabled={isSaving}
        />
      </div>

      {/* 件名 (Subject) */}
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="gmail-subject">
          件名 (Subject)
        </label>
        <input
          id="gmail-subject"
          type="text"
          className={styles.input}
          value={formValues.subject}
          onChange={handleInputChange("subject")}
          disabled={isSaving}
        />
      </div>

      {/* 本文 (Body) */}
      <div className={styles.bodyFieldGroup}>
        <label className={styles.label} htmlFor="gmail-body">
          本文 (Body)
        </label>
        <textarea
          id="gmail-body"
          className={styles.bodyTextarea} // 🎯 修正: bodyTextarea を適用
          value={formValues.body}
          onChange={handleInputChange("body")}
          disabled={isSaving}
        />
      </div>
    </div>
  );
});

GmailDraftContent.modalSize = {
  width: "min(95vw, calc(75vh * (21 / 9)))",
  height: "min(75vh, calc(95vw * (9 / 21)))",
};

GmailDraftContent.displayName = "GmailDraftContent";
