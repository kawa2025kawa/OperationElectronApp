// src/renderer/features/other/components/modal/gmailModal/GmailModalContent.tsx

import React from "react";
import type { ModalContentProps } from "../useOtherModalLogic"; // 🎯 Other用の共通型を参照
import * as styles from "./gmailModalContent.css";
import { useGmailModalContent } from "./useGmailModalContent";

interface GmailModalContentProps extends ModalContentProps {
  forceTemplateSelection?: boolean;
}

export const GmailModalContent: React.FC<GmailModalContentProps> = React.memo(
  ({ registerPrimaryAction, forceTemplateSelection = false }) => {
    const {
      userEmail,
      templateKey,
      to,
      cc,
      subject,
      body,
      isSaving,
      templateOptions,
      handleTemplateChange,
      handleToChange,
      handleCcChange,
      handleSubjectChange,
      handleBodyChange,
    } = useGmailModalContent({
      registerPrimaryAction,
      forceTemplateSelection,
    });

    return (
      <div className={styles.formContainer}>
        {/* Template */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="gmail-template">
            メールテンプレート
          </label>
          <select
            id="gmail-template"
            className={styles.input}
            value={templateKey ?? ""}
            onChange={handleTemplateChange}
            disabled={isSaving}
          >
            <option value="">テンプレートを選択してください</option>
            {templateOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* From */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="gmail-from">
            送信元 (From)
          </label>
          <input
            id="gmail-from"
            type="text"
            className={styles.input}
            value={userEmail || "ログイン中のアカウント (自動取得)"}
            disabled
          />
        </div>

        {/* To */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="gmail-to">
            宛先 (To)
          </label>
          <input
            id="gmail-to"
            type="email"
            className={styles.input}
            placeholder="example@domain.com"
            value={to}
            onChange={handleToChange}
            disabled={isSaving}
          />
        </div>

        {/* CC */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="gmail-cc">
            CC
          </label>
          <input
            id="gmail-cc"
            type="email"
            className={styles.input}
            placeholder="cc@domain.com (複数の場合はカンマ区切り)"
            value={cc}
            onChange={handleCcChange}
            disabled={isSaving}
          />
        </div>

        {/* Subject */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="gmail-subject">
            件名 (Subject)
          </label>
          <input
            id="gmail-subject"
            type="text"
            className={styles.input}
            value={subject}
            onChange={handleSubjectChange}
            disabled={isSaving}
          />
        </div>

        {/* Body */}
        <div className={styles.bodyFieldGroup}>
          <label className={styles.label} htmlFor="gmail-body">
            本文 (Body)
          </label>
          <textarea
            id="gmail-body"
            className={styles.textarea}
            value={body}
            onChange={handleBodyChange}
            disabled={isSaving}
          />
        </div>
      </div>
    );
  },
);

GmailModalContent.displayName = "GmailModalContent";
export default GmailModalContent;
