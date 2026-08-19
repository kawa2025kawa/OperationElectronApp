// src/renderer/features/operation/components/modal/gmailModal/GmailModalContent.tsx

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { gmailService } from "@renderer/features/operation/services/gmailService";
import { selectActiveSelectedItem } from "@renderer/features/operation/store/operationSelectors";
import { useAppStore } from "@shared/store";
import type { ModalContentProps } from "../useOperationModalLogic";
import * as styles from "./gmailModalContent.css";
import { getEmailTemplate } from "./templates";

/**
 * 来週の火曜日の日付文字列 (例: "8月25日(火)") を取得する
 */
function getNextTuesdayString(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilThisTuesday = (dayOfWeek + 5) % 7;
  const daysUntilNextTuesday = daysUntilThisTuesday + 7;

  const nextTuesday = new Date(now);
  nextTuesday.setDate(now.getDate() + daysUntilNextTuesday);

  return `${nextTuesday.getMonth() + 1}月${nextTuesday.getDate()}日(火)`;
}

export const GmailModalContent: React.FC<ModalContentProps> = React.memo(
  ({ registerPrimaryAction }) => {
    const selectedItem = useAppStore(selectActiveSelectedItem);
    const userEmail = useAppStore((s) => s.userEmail);
    const familyName = useAppStore((s) => s.familyName);

    // Googleアカウントの姓（family_name）を使用
    const lastName = familyName || "担当";
    const nextTuesdayStr = getNextTuesdayString();

    // 管理番号に対応するテンプレートの取得と本文生成
    const template = getEmailTemplate(selectedItem?.kanriNo);
    const initialBody = template.generateBody({
      lastName,
      nextTuesdayStr,
      links: selectedItem?.link,
    });

    const [to, setTo] = useState(template.to);
    const [cc, setCc] = useState(template.cc ?? "");
    const [subject, setSubject] = useState(
      template.subject ||
        (selectedItem ? `【作業連絡】${selectedItem.workName}` : ""),
    );
    const [body, setBody] = useState(initialBody);
    const [isSaving, setIsSaving] = useState(false);

    // 署名の自動差し込み (IPC 経由で Main プロセスから取得)
    useEffect(() => {
      let isMounted = true;

      void gmailService
        .getPrimarySignature()
        .then((signature) => {
          if (isMounted && signature && signature.trim().length > 0) {
            setBody((prev) => `${prev.trim()}\n\n--\n${signature}`);
          }
        })
        .catch((err) => {
          console.warn(
            "[GmailModal] 署名の自動差し込みをスキップしました:",
            err,
          );
        });

      return () => {
        isMounted = false;
      };
    }, []);

    const handleExecute = useCallback(async () => {
      if (!to.trim()) {
        toast.error("宛先(To)を入力してください");
        throw new Error("宛先未入力");
      }

      setIsSaving(true);

      try {
        await gmailService.createDraft({
          to: to.trim(),
          cc: cc.trim(),
          subject: subject.trim(),
          body,
        });

        toast.success("Gmailの下書きに保存しました");
      } catch (error) {
        console.error("[GmailModal] Failed to create draft:", error);

        toast.error(
          error instanceof Error ? error.message : "下書き保存に失敗しました",
        );

        throw error;
      } finally {
        setIsSaving(false);
      }
    }, [to, cc, subject, body]);

    useEffect(() => {
      registerPrimaryAction(handleExecute);

      return () => registerPrimaryAction(undefined);
    }, [handleExecute, registerPrimaryAction]);

    return (
      <div className={styles.formContainer}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>送信元 (From)</label>

          <input
            type="text"
            className={styles.input}
            value={userEmail || "ログイン中のアカウント (自動取得)"}
            disabled
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>宛先 (To)</label>

          <input
            type="email"
            className={styles.input}
            placeholder="example@domain.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={isSaving}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>CC</label>

          <input
            type="email"
            className={styles.input}
            placeholder="cc@domain.com (複数の場合はカンマ区切り)"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            disabled={isSaving}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>件名 (Subject)</label>

          <input
            type="text"
            className={styles.input}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isSaving}
          />
        </div>

        <div className={styles.fieldGroup} style={{ flex: 1 }}>
          <label className={styles.label}>本文 (Body)</label>

          <textarea
            className={styles.textarea}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={isSaving}
          />
        </div>
      </div>
    );
  },
);

GmailModalContent.displayName = "GmailModalContent";

export default GmailModalContent;
