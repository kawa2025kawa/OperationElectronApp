// src/renderer/features/other/components/modal/contents/gmailDraft/GmailDraftContent.tsx

import { memo } from "react";
import { Select } from "@base-ui/react/select";

import { AuthView } from "@renderer/features/auth/AuthView";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { EmailTemplateKey } from "@renderer/features/other/types/gmailDraftUiTypes";

import * as styles from "./gmailDraftContent.css";
import { EMAIL_TEMPLATE_OPTIONS } from "@renderer/features/other/types/gmailDraftUiTypes";
import { useGmailModalLogic } from "./useGmailModalLogic";

const TEMPLATE_SELECT_ITEMS = [
  { value: null, label: "手動作成" },
  ...EMAIL_TEMPLATE_OPTIONS.map(({ key, label }) => ({
    value: key,
    label,
  })),
];

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
        <Select.Root
          value={templateKey}
          items={TEMPLATE_SELECT_ITEMS}
          disabled={isSaving}
          onValueChange={(value) =>
            handleTemplateChange(value as EmailTemplateKey | null)
          }
        >
          <Select.Label className={styles.label}>テンプレート</Select.Label>

          <Select.Trigger id="gmail-template" className={styles.selectInput}>
            <Select.Value placeholder="手動作成" />
          </Select.Trigger>

          <Select.Portal>
            <Select.Positioner
              className={styles.selectPositioner}
              side="bottom"
              align="start"
              sideOffset={4}
              alignItemWithTrigger={false}
            >
              <Select.Popup className={styles.selectPopup}>
                <Select.List className={styles.selectList}>
                  {TEMPLATE_SELECT_ITEMS.map((item) => (
                    <Select.Item
                      key={item.value ?? "manual"}
                      value={item.value}
                      className={styles.selectItem}
                    >
                      <Select.ItemText>{item.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
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
