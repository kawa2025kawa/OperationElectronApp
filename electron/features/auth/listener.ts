// electron/features/auth/listener.ts

import * as http from "node:http";

export interface OAuthCallback {
  code: string;
  state: string;
}

export const OAUTH_LISTENER_CONFIG = {
  host: "127.0.0.1",
  defaultTimeoutMs: 60000,
} as const;

let activeListener: ((error: Error) => void) | null = null;

const createHtml = (title: string, message: string) =>
  `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>${title}</title></head><body><h1>${title}</h1><p>${message}</p></body></html>`;

const HTML_SUCCESS = createHtml(
  "認証完了",
  "Google ログインが完了しました。このウィンドウを閉じてアプリに戻ってください。",
);
const HTML_ERROR = createHtml(
  "認証エラー",
  "Google ログインでエラーが発生しました。アプリからやり直してください。",
);
const HTML_INVALID = createHtml("不正なリクエスト", "無効なリクエストです。");

export function startListener(
  port: number,
  expectedState: string,
  timeoutMs: number = OAUTH_LISTENER_CONFIG.defaultTimeoutMs,
  onListening?: () => void | Promise<void>,
): Promise<OAuthCallback> {
  activeListener?.(new Error("OAuth listener was replaced"));

  return new Promise((resolve, reject) => {
    let settled = false;
    let timer: NodeJS.Timeout | null = null;

    const server = http.createServer((req, res) => {
      void handleRequest(req, res);
    });

    const cleanup = (): void => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (activeListener === fail) {
        activeListener = null;
      }
      if (server.listening) {
        server.close();
      }
    };

    const succeed = (callback: OAuthCallback): void => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(callback);
    };

    const fail = (error: Error): void => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const respond = (
      res: http.ServerResponse,
      status: number,
      body: string,
    ): void => {
      res.writeHead(status, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(body);
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
        respond(res, 405, HTML_INVALID);
        fail(new Error("OAuth callback must use GET"));
        return;
      }

      const url = new URL(
        req.url ?? "/",
        `http://${OAUTH_LISTENER_CONFIG.host}:${port}`,
      );
      const error = url.searchParams.get("error");
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (error) {
        respond(res, 400, HTML_ERROR);
        fail(new Error(`Google OAuth error: ${error}`));
        return;
      }

      if (!code || !state || state !== expectedState) {
        respond(res, 400, HTML_INVALID);
        fail(new Error("Invalid OAuth callback parameters or state mismatch"));
        return;
      }

      respond(res, 200, HTML_SUCCESS);
      succeed({ code, state });
    }

    activeListener = fail;

    timer = setTimeout(() => {
      fail(new Error("Google OAuth ログインがタイムアウトしました"));
    }, timeoutMs);

    server.once("error", (error) => {
      fail(new Error(`OAuth listener error: ${error.message}`));
    });

    server.listen(port, OAUTH_LISTENER_CONFIG.host, () => {
      console.log(
        `[OAuthListener] Listening on http://${OAUTH_LISTENER_CONFIG.host}:${port}`,
      );
      if (!onListening) return;

      void Promise.resolve()
        .then(onListening)
        .catch((error: unknown) => {
          fail(error instanceof Error ? error : new Error(String(error)));
        });
    });
  });
}
