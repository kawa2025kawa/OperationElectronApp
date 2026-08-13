// electron/services/auth/listener.ts

import * as http from "node:http";

// =====================================================
// Types
// =====================================================

export interface OAuthCallback {
  code: string;
  state: string;
}

// =====================================================
// Constants
// =====================================================

const HOST = "127.0.0.1";

// =====================================================
// Response
// =====================================================

function sendResponse(
  res: http.ServerResponse,
  statusCode: number,
  body: string,
): void {
  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
  });

  res.end(body);
}

// =====================================================
// Server
// =====================================================

function closeServer(server: http.Server): void {
  if (server.listening) {
    server.close();
  }
}

// =====================================================
// OAuth Callback Listener
// =====================================================

export function startListener(
  port: number,
  expectedState: string,
): Promise<OAuthCallback> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (callback: () => void): void => {
      if (settled) {
        return;
      }

      settled = true;
      closeServer(server);
      callback();
    };

    const server = http.createServer((req, res) => {
      try {
        const requestUrl = new URL(req.url ?? "/", `http://${HOST}:${port}`);

        const error = requestUrl.searchParams.get("error");

        const errorDescription =
          requestUrl.searchParams.get("error_description");

        const code = requestUrl.searchParams.get("code");

        const state = requestUrl.searchParams.get("state");

        // -------------------------------------------
        // Google OAuth Error
        // -------------------------------------------

        if (error) {
          sendResponse(res, 400, "<h1>Authentication failed.</h1>");

          finish(() => {
            reject(
              new Error(
                `Google OAuth error: ${error}${
                  errorDescription ? ` - ${errorDescription}` : ""
                }`,
              ),
            );
          });

          return;
        }

        // -------------------------------------------
        // Authorization Code
        // -------------------------------------------

        if (!code) {
          sendResponse(res, 400, "<h1>Authorization code not found.</h1>");

          finish(() => {
            reject(new Error("Authorization code not found"));
          });

          return;
        }

        // -------------------------------------------
        // OAuth State
        // -------------------------------------------

        if (!state) {
          sendResponse(res, 400, "<h1>OAuth state not found.</h1>");

          finish(() => {
            reject(new Error("OAuth state not found"));
          });

          return;
        }

        // -------------------------------------------
        // State Validation
        // -------------------------------------------

        if (state !== expectedState) {
          sendResponse(res, 400, "<h1>Invalid OAuth state.</h1>");

          finish(() => {
            reject(new Error("OAuth state mismatch"));
          });

          return;
        }

        // -------------------------------------------
        // Success
        // -------------------------------------------

        sendResponse(
          res,
          200,
          `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>認証完了</title>
</head>
<body>
  <h1>認証が完了しました</h1>
  <p>このタブを閉じてアプリに戻ってください。</p>
</body>
</html>
            `.trim(),
        );

        finish(() => {
          resolve({
            code,
            state,
          });
        });
      } catch (error) {
        finish(() => {
          reject(error instanceof Error ? error : new Error(String(error)));
        });
      }
    });

    // -----------------------------------------------
    // Server Error
    // -----------------------------------------------

    server.on("error", (error) => {
      finish(() => {
        reject(
          new Error(`OAuth listener error: ${error.message}`, {
            cause: error,
          }),
        );
      });
    });

    // -----------------------------------------------
    // Start Listener
    // -----------------------------------------------

    server.listen(port, HOST);
  });
}
