// src/renderer/features/other/components/modal/gmailModal/GmailModalContent.tsx

import React from "react";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import { AuthView } from "@renderer/features/auth/AuthView";
import * as styles from "./gmailModalContent.css";
import {
  EMAIL_TEMPLATE_OPTIONS,
  type EmailTemplateOption,
} from "./gmailTemplates";
import { useGmailModalLogic } from "./useGmailModalLogic";

interface GmailModalContentProps {
  onClose: () => void;
}

export const GmailModalContent: React.FC<GmailModalContentProps> = React.memo(
  ({ onClose }) => {
    const {
      isAuthenticated,
      userEmail,
      templateKey,
      formValues,
      isSaving,
      isExecuted,
      handleInputChange,
      handleTemplateChange,
      handleExecute,
    } = useGmailModalLogic();

    if (!isAuthenticated) {
      return (
        <div className={styles.modalContainer}>
          <header className={styles.header}>
            <h2 className={styles.modalTitle}>Googleアカウント認証</h2>
            <CloseButton onClick={onClose} />
          </header>
          <div className={styles.formContainer}>
            <AuthView />
          </div>
        </div>
      );
    }

    return (
      <div className={styles.modalContainer}>
        {/* Header */}
        <header className={styles.header}>
          <h2 className={styles.modalTitle}>
            {isExecuted ? "下書き作成完了" : "Gmail下書き作成"}
          </h2>
          {!isExecuted && <CloseButton onClick={onClose} />}
        </header>

        {/* Form Main Body */}
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
              disabled={isSaving || isExecuted}
            >
              <option value="">テンプレートを選択してください</option>
              {EMAIL_TEMPLATE_OPTIONS.map((option: EmailTemplateOption) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="gmail-from">
              送信元 (From)
            </label>
            <input
              id="gmail-from"
              type="text"
              className={styles.input}
              value={userEmail || "me"}
              disabled
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="gmail-to">
              宛先 (To)
            </label>
            <textarea
              id="gmail-to"
              className={styles.textarea}
              rows={3}
              placeholder="example@domain.com"
              value={formValues.to}
              onChange={handleInputChange("to")}
              disabled={isSaving || isExecuted}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="gmail-cc">
              CC
            </label>
            <textarea
              id="gmail-cc"
              className={styles.textarea}
              rows={2}
              placeholder="cc@domain.com (任意)"
              value={formValues.cc}
              onChange={handleInputChange("cc")}
              disabled={isSaving || isExecuted}
            />
          </div>

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
              disabled={isSaving || isExecuted}
            />
          </div>

          <div className={styles.bodyFieldGroup}>
            <label className={styles.label} htmlFor="gmail-body">
              本文 (Body)
            </label>
            <textarea
              id="gmail-body"
              className={styles.textarea}
              value={formValues.body}
              onChange={handleInputChange("body")}
              disabled={isSaving || isExecuted}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          {isExecuted ? (
            <button type="button" className={styles.button} onClick={onClose}>
              OK
            </button>
          ) : (
            <>
              <button type="button" className={styles.button} onClick={onClose}>
                キャンセル
              </button>
              <button
                type="button"
                className={styles.button}
                onClick={handleExecute}
                disabled={!templateKey || isSaving}
              >
                {isSaving ? "作成中..." : "作成実行"}
              </button>
            </>
          )}
        </footer>
      </div>
    );
  },
);

GmailModalContent.displayName = "GmailModalContent";
