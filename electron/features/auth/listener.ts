// electron/features/auth/listener.ts

import * as http from "node:http";

export interface OAuthCallback {
  code: string;
  state: string;
}

const HOST = "127.0.0.1";

const SUCCESS_RESPONSE = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>認証完了</title>
</head>
<body>
  <h1>認証が完了しました</h1>
  <p>このタブを閉じてアプリに戻ってください。</p>
</body>
</html>
`.trim();

const AUTH_ERROR_RESPONSE = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>認証失敗</title>
</head>
<body>
  <h1>認証に失敗しました</h1>
  <p>アプリに戻って再度ログインしてください。</p>
</body>
</html>
`.trim();

const INVALID_REQUEST_RESPONSE = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>認証エラー</title>
</head>
<body>
  <h1>認証リクエストが不正です</h1>
  <p>アプリに戻って再度ログインしてください。</p>
</body>
</html>
`.trim();

function sendResponse(
  response: http.ServerResponse,
  statusCode: number,
  body: string,
): void {
  response.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });

  response.end(body);
}

function closeServer(server: http.Server): Promise<void> {
  return new Promise((resolve) => {
    if (!server.listening) {
      resolve();
      return;
    }

    server.close((error) => {
      if (error) {
        console.warn("[OAuthListener] Failed to close server:", error);
      }

      resolve();
    });
  });
}

function toError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(error == null ? fallbackMessage : String(error), {
    cause: error,
  });
}

export function startListener(
  port: number,
  expectedState: string,
): Promise<OAuthCallback> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const server = http.createServer((request, response) => {
      void handleRequest(request, response);
    });

    const finish = async (callback: () => void): Promise<void> => {
      if (settled) {
        return;
      }

      settled = true;

      await closeServer(server);
      callback();
    };

    const rejectWithError = async (
      response: http.ServerResponse,
      statusCode: number,
      responseBody: string,
      error: Error,
    ): Promise<void> => {
      sendResponse(response, statusCode, responseBody);
      await finish(() => reject(error));
    };

    async function handleRequest(
      request: http.IncomingMessage,
      response: http.ServerResponse,
    ): Promise<void> {
      try {
        if (request.method !== "GET") {
          await rejectWithError(
            response,
            405,
            INVALID_REQUEST_RESPONSE,
            new Error("OAuth callback must use GET"),
          );
          return;
        }

        const requestUrl = new URL(
          request.url ?? "/",
          `http://${HOST}:${port}`,
        );

        const error = requestUrl.searchParams.get("error");
        const errorDescription =
          requestUrl.searchParams.get("error_description");

        const code = requestUrl.searchParams.get("code");
        const state = requestUrl.searchParams.get("state");

        if (error) {
          const description = errorDescription ? ` - ${errorDescription}` : "";

          await rejectWithError(
            response,
            400,
            AUTH_ERROR_RESPONSE,
            new Error(`Google OAuth error: ${error}${description}`),
          );

          return;
        }

        if (!code) {
          await rejectWithError(
            response,
            400,
            INVALID_REQUEST_RESPONSE,
            new Error("Authorization code not found"),
          );

          return;
        }

        if (!state) {
          await rejectWithError(
            response,
            400,
            INVALID_REQUEST_RESPONSE,
            new Error("OAuth state not found"),
          );

          return;
        }

        if (state !== expectedState) {
          await rejectWithError(
            response,
            400,
            AUTH_ERROR_RESPONSE,
            new Error("OAuth state mismatch"),
          );

          return;
        }

        sendResponse(response, 200, SUCCESS_RESPONSE);

        await finish(() => {
          resolve({
            code,
            state,
          });
        });
      } catch (error) {
        await finish(() => {
          reject(toError(error, "OAuth callback handling failed"));
        });
      }
    }

    server.once("error", (error) => {
      void finish(() => {
        reject(
          new Error(`OAuth listener error: ${error.message}`, {
            cause: error,
          }),
        );
      });
    });

    server.listen(port, HOST, () => {
      console.log(`[OAuthListener] Listening on http://${HOST}:${port}`);
    });
  });
}
