//electron\auth\listener.ts

import * as http from "node:http";

export function startListener(port: number): Promise<{
  code: string;
  state: string;
}> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url!, `http://127.0.0.1:${port}`);

      const code = url.searchParams.get("code");

      const state = url.searchParams.get("state");

      res.end("Authentication complete. Close this window.");

      server.close();

      resolve({
        code: code!,
        state: state!,
      });
    });

    server.listen(port, "127.0.0.1");
  });
}
