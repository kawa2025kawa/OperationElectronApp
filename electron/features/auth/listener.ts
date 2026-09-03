// electron/features/auth/listener.ts

import * as http from "node:http";

export interface OAuthCallback {
  code: string;
  state: string;
}

const HOST = "127.0.0.1";
const DEFAULT_TIMEOUT_MS = 60000;

let activeServer: http.Server | null = null;

export function stopListener(): void {
  if (activeServer) {
    activeServer.close();
    activeServer = null;
  }
}

const createHtmlPage = (title: string, message: string) =>
  `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>${title}</title></head>
<body><h1>${title}</h1><p>${message}</p></body>
</html>`.trim();

const SUCCESS_RESPONSE = createHtmlPage(
  "認証完了",
  "Google ログインが完了しました。このウィンドウを閉じてアプリに戻ってください。",
);
const AUTH_ERROR_RESPONSE = createHtmlPage(
  "認証エラー",
  "Google ログインでエラーが発生しました。アプリからやり直してください。",
);
const INVALID_REQUEST_RESPONSE = createHtmlPage(
  "不正なリクエスト",
  "無効なリクエストです。",
);

export function startListener(
  port: number,
  expectedState: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<OAuthCallback> {
  stopListener(); // 既存リスナーの強制クリーンアップ

  return new Promise((resolve, reject) => {
    let settled = false;
    let timer: NodeJS.Timeout | null = null;

    const server = http.createServer((req, res) => {
      void handleRequest(req, res);
    });
    activeServer = server;

    const closeAndCleanup = async () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (activeServer) {
        await new Promise<void>((r) => activeServer?.close(() => r()));
        activeServer = null;
      }
    };

    const respondAndSettle = async (
      res: http.ServerResponse,
      status: number,
      body: string,
      action: () => void,
    ) => {
      if (settled) return;
      settled = true;
      res.writeHead(status, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(body);
      await closeAndCleanup();
      action();
    };

    timer = setTimeout(async () => {
      if (settled) return;
      settled = true;
      await closeAndCleanup();
      reject(new Error("Google OAuth ログインがタイムアウトしました"));
    }, timeoutMs);

    async function handleRequest(
      req: http.IncomingMessage,
      res: http.ServerResponse,
    ) {
      if (req.method !== "GET") {
        return respondAndSettle(res, 405, INVALID_REQUEST_RESPONSE, () =>
          reject(new Error("OAuth callback must use GET")),
        );
      }

      const url = new URL(req.url ?? "/", `http://${HOST}:${port}`);
      const error = url.searchParams.get("error");
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (error) {
        return respondAndSettle(res, 400, AUTH_ERROR_RESPONSE, () =>
          reject(new Error(`Google OAuth error: ${error}`)),
        );
      }

      if (!code || !state || state !== expectedState) {
        return respondAndSettle(res, 400, INVALID_REQUEST_RESPONSE, () =>
          reject(
            new Error("Invalid OAuth callback parameters or state mismatch"),
          ),
        );
      }

      await respondAndSettle(res, 200, SUCCESS_RESPONSE, () =>
        resolve({ code, state }),
      );
    }

    server.once("error", async (err) => {
      if (settled) return;
      settled = true;
      await closeAndCleanup();
      reject(new Error(`OAuth listener error: ${err.message}`));
    });

    server.listen(port, HOST, () => {
      console.log(`[OAuthListener] Listening on http://${HOST}:${port}`);
    });
  });
}
