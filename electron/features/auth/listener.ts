import * as http from "node:http";

export interface OAuthCallback {
  code: string;
  state: string;
}

const HOST = "127.0.0.1";

const createHtmlPage = (title: string, message: string) =>
  `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>${title}</title></head>
<body><h1>${title}</h1><p>${message}</p></body>
</html>`.trim();

const SUCCESS_RESPONSE = createHtmlPage(
  "認証完了",
  "このタブを閉じてアプリに戻ってください。",
);
const AUTH_ERROR_RESPONSE = createHtmlPage(
  "認証失敗",
  "アプリに戻って再度ログインしてください。",
);
const INVALID_REQUEST_RESPONSE = createHtmlPage(
  "認証エラー",
  "アプリに戻って再度ログインしてください。",
);

export function startListener(
  port: number,
  expectedState: string,
): Promise<OAuthCallback> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const server = http.createServer((req, res) => {
      void handleRequest(req, res);
    });

    const closeAndCleanup = async () => {
      if (server.listening) {
        await new Promise<void>((r) => server.close(() => r()));
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
