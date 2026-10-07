// src/renderer/features/other/components/modal/contents/gmailDraft/GmailDraftContent.tsx

import { memo } from "react";

import { AuthView } from "@renderer/features/auth/AuthView";
import type { GlobalModalComponent } from "@shared/types/ui/modal";

import * as styles from "./gmailDraftContent.css";
import { EMAIL_TEMPLATE_OPTIONS } from "../../../../templates/gmailTemplates";
import { useGmailModalLogic } from "./useGmailModalLogic";

export const GmailDraftContent: GlobalModalComponent = memo(() => {
  const {
    isAuthenticated,
    userEmail,
    templateKey,
    formValues,
    isSaving,
    handleInputChange,
    handleTemplateChange,
  } = useGmailModalLogic();

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

          {EMAIL_TEMPLATE_OPTIONS.map((option) => (
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

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="gmail-to">
          宛先 (To)
        </label>

        <textarea
          id="gmail-to"
          className={styles.addressTextarea}
          rows={1}
          placeholder="example@domain.com"
          value={formValues.to}
          onChange={handleInputChange("to")}
          disabled={isSaving}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="gmail-cc">
          CC
        </label>

        <textarea
          id="gmail-cc"
          className={styles.addressTextarea}
          rows={1}
          placeholder="cc@domain.com"
          value={formValues.cc}
          onChange={handleInputChange("cc")}
          disabled={isSaving}
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
          disabled={isSaving}
        />
      </div>

      <div className={styles.bodyFieldGroup}>
        <label className={styles.label} htmlFor="gmail-body">
          本文 (Body)
        </label>

        <textarea
          id="gmail-body"
          className={styles.bodyTextarea}
          value={formValues.body}
          onChange={handleInputChange("body")}
          disabled={isSaving}
        />
      </div>
    </div>
  );
});

GmailDraftContent.displayName = "GmailDraftContent";
