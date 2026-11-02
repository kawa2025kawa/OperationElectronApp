// electron/features/auth/listener.ts

import * as http from "node:http";

export interface OAuthCallback {
  code: string;
  state: string;
}

const HOST = "127.0.0.1";
const DEFAULT_TIMEOUT_MS = 60000;

let activeServer: http.Server | null = null;

function stopListener(): void {
  if (!activeServer) return;

  activeServer.close();
  activeServer = null;
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
  onListening?: () => void | Promise<void>,
): Promise<OAuthCallback> {
  stopListener();

  return new Promise((resolve, reject) => {
    let settled = false;
    let timer: NodeJS.Timeout | null = null;

    const server = http.createServer((req, res) => {
      void handleRequest(req, res);
    });

    activeServer = server;

    const closeAndCleanup = async (): Promise<void> => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      if (activeServer === server) {
        activeServer = null;
      }

      if (server.listening) {
        await new Promise<void>((resolveClose) => {
          server.close(() => resolveClose());
        });
      }
    };

    const respondAndSettle = async (
      res: http.ServerResponse,
      status: number,
      body: string,
      action: () => void,
    ): Promise<void> => {
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

    const fail = async (error: Error): Promise<void> => {
      if (settled) return;

      settled = true;
      await closeAndCleanup();
      reject(error);
    };

    async function handleRequest(
      req: http.IncomingMessage,
      res: http.ServerResponse,
    ): Promise<void> {
      if (settled) {
        res.writeHead(410, { "Cache-Control": "no-store" });
        res.end();
        return;
      }

      if (req.method !== "GET") {
        await respondAndSettle(res, 405, INVALID_REQUEST_RESPONSE, () =>
          reject(new Error("OAuth callback must use GET")),
        );
        return;
      }

      const url = new URL(req.url ?? "/", `http://${HOST}:${port}`);
      const error = url.searchParams.get("error");
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (error) {
        await respondAndSettle(res, 400, AUTH_ERROR_RESPONSE, () =>
          reject(new Error(`Google OAuth error: ${error}`)),
        );
        return;
      }

      if (!code || !state || state !== expectedState) {
        await respondAndSettle(res, 400, INVALID_REQUEST_RESPONSE, () =>
          reject(
            new Error("Invalid OAuth callback parameters or state mismatch"),
          ),
        );
        return;
      }

      await respondAndSettle(res, 200, SUCCESS_RESPONSE, () =>
        resolve({ code, state }),
      );
    }

    timer = setTimeout(() => {
      void fail(new Error("Google OAuth ログインがタイムアウトしました"));
    }, timeoutMs);

    server.once("error", (error) => {
      void fail(new Error(`OAuth listener error: ${error.message}`));
    });

    server.listen(port, HOST, () => {
      console.log(`[OAuthListener] Listening on http://${HOST}:${port}`);

      if (!onListening) return;

      void Promise.resolve()
        .then(onListening)
        .catch((error: unknown) => {
          void fail(error instanceof Error ? error : new Error(String(error)));
        });
    });
  });
}
