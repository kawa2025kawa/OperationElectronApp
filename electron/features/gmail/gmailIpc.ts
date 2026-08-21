// electron/features/gmail/gmailIpc.ts
import { ipcMain } from "electron";

export function registerGmailIpc(): void {
  // 署名の取得
  ipcMain.handle("gmail:getSignature", async (_event, accessToken?: string) => {
    if (!accessToken) return "";

    try {
      const res = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!res.ok) return "";
      const data = (await res.json()) as {
        sendAs?: Array<{ isPrimary?: boolean; signature?: string }>;
      };
      const primary = data.sendAs?.find((s) => s.isPrimary);
      return primary?.signature ?? "";
    } catch (error) {
      console.error("[GmailIPC] Failed to fetch signature:", error);
      return "";
    }
  });

  // 下書きの作成
  ipcMain.handle(
    "gmail:createDraft",
    async (_event, params: { accessToken: string; raw: string }) => {
      const { accessToken, raw } = params;
      if (!accessToken) {
        throw new Error(
          "アクセストークンが取得できていません。再ログインしてください。",
        );
      }

      const res = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/drafts",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              raw: raw,
            },
          }),
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gmail API Error (${res.status}): ${errText}`);
      }

      return await res.json();
    },
  );
}
