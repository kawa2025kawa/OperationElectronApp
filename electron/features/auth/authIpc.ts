// electron/features/auth/authIpc.ts

import { ipcMain } from "electron";
import { GoogleOAuthService } from "@electron/features/spreadsheet/googleOAuthService";

const authService = new GoogleOAuthService();

/**
 * HTML文字列からプレーンテキストの署名文字列へ変換する
 */
function parseSignatureToPlainText(htmlSignature: string): string {
  return (
    htmlSignature
      // 改行を持つHTML要素を先に改行へ変換
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<\/tr>/gi, "\n")
      .replace(/<\/h[1-6]>/gi, "\n")

      // 残りのHTMLタグを除去
      .replace(/<[^>]+>/g, "")

      // HTML entity
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")

      // 改行コードを整理
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")

      // 3行以上の連続改行を2行までにする
      .replace(/\n{3,}/g, "\n\n")

      .trim()
  );
}

export function registerAuthIpc(): void {
  ipcMain.handle("googleAuth:login", () => {
    return authService.login();
  });

  ipcMain.handle("googleAuth:loadSession", () => {
    return authService.loadSession();
  });

  ipcMain.handle("googleAuth:logout", () => {
    return authService.clearSession();
  });

  // =====================================================
  // Gmail 署名取得 IPC
  // =====================================================

  ipcMain.handle(
    "gmail:getSignature",
    async (_event, accessToken?: string): Promise<string> => {
      if (!accessToken) {
        console.warn("[IPC] gmail:getSignature: Access token is missing.");
        return "";
      }

      try {
        const response = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          },
        );

        if (!response.ok) {
          console.warn(
            `[IPC] gmail:getSignature: SendAs API failed with status ${response.status}`,
          );
          return "";
        }

        const data = (await response.json()) as {
          sendAs?: Array<{ isPrimary?: boolean; signature?: string }>;
        };

        const primarySendAs = data.sendAs?.find((sendAs) => sendAs.isPrimary);

        if (primarySendAs?.signature) {
          return parseSignatureToPlainText(primarySendAs.signature);
        }

        return "";
      } catch (error) {
        console.error("[IPC] gmail:getSignature failed:", error);
        return "";
      }
    },
  );

  // =====================================================
  // Gmail 下書き作成 IPC
  // =====================================================

  ipcMain.handle(
    "gmail:createDraft",
    async (
      _event,
      params: {
        accessToken: string;
        raw: string;
      },
    ): Promise<void> => {
      const { accessToken, raw } = params;

      if (!accessToken) {
        throw new Error(
          "Gmail 下書き作成に必要なアクセストークンがありません。",
        );
      }

      if (!raw) {
        throw new Error(
          "Gmail 下書き作成に必要な MIME メッセージがありません。",
        );
      }

      try {
        const response = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/drafts",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              message: {
                raw,
              },
            }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();

          throw new Error(
            `Gmail API createDraft failed: ${response.status} ${errorText}`,
          );
        }

        console.log("[IPC] gmail:createDraft succeeded.");
      } catch (error) {
        console.error("[IPC] gmail:createDraft failed:", error);
        throw error;
      }
    },
  );

  console.log("[IPC] auth handlers registered");
}
