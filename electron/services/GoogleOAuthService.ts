import { app, shell } from "electron";
import keytar from "keytar";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import http from "http";

const SERVICE_NAME = "OperationApp_GoogleOAuth";
const ACCOUNT_NAME = "session";

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class GoogleOAuthService {
  private getCredentialsPath(): string {
    return app.isPackaged
      ? path.join(process.resourcesPath, "google-oauth-credentials.json")
      : path.join(process.cwd(), "resources", "google-oauth-credentials.json");
  }

  public getClientCredentials() {
    const filePath = this.getCredentialsPath();
    if (!fs.existsSync(filePath)) {
      throw new Error(`google-oauth-credentials.json が存在しません: ${filePath}`);
    }
    const json = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const config = json.installed ?? json.web;
    if (!config?.client_id) throw new Error("client_id が見つかりません");

    return {
      clientId: config.client_id as string,
      clientSecret: config.client_secret as string | undefined,
      redirectHost: config.redirect_uris?.[0]?.includes("localhost") ? "localhost" : "127.0.0.1",
    };
  }

  private createPkce() {
    const base64Url = (b: Buffer) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    const verifier = base64Url(crypto.randomBytes(64));
    const challenge = base64Url(crypto.createHash("sha256").update(verifier).digest());
    return { verifier, challenge, state: crypto.randomBytes(32).toString("hex") };
  }

  private getSuccessHtml(): string {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>認証完了 - OperationApp</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@700&family=Noto+Sans+JP:wght@500;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #1e2227;
      --card-bg: #1e2227;
      --text: #a1a2a4;
      --text-hover: #ffffff;
      --accent: #00c8b4;
      --shadow-raised: 8px 8px 16px rgba(0,0,0,0.6), -5px -5px 12px rgba(255,255,255,0.05);
      --shadow-pressed: inset 4px 4px 8px rgba(0,0,0,0.7), inset -3px -3px 6px rgba(255,255,255,0.05);
      --glow: 0 0 20px rgba(0, 200, 180, 0.4);
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg: #ecf0f3;
        --card-bg: #ecf0f3;
        --text: #5f6368;
        --text-hover: #202124;
        --accent: #00a896;
        --shadow-raised: 8px 8px 16px rgba(0,0,0,0.12), -6px -6px 12px rgba(255,255,255,0.9);
        --shadow-pressed: inset 4px 4px 8px rgba(0,0,0,0.12), inset -4px -4px 8px rgba(255,255,255,0.9);
        --glow: 0 0 15px rgba(0, 168, 150, 0.3);
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Noto Sans JP', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: var(--card-bg);
      border-radius: 20px;
      box-shadow: var(--shadow-raised);
      padding: 48px 40px;
      text-align: center;
      max-width: 420px;
      width: 100%;
      animation: fadeIn 0.4s ease-out;
    }
    .icon-box {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      margin: 0 auto 28px;
      box-shadow: var(--shadow-pressed);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent);
    }
    .icon-box svg {
      width: 40px;
      height: 40px;
      filter: drop-shadow(var(--glow));
    }
    h1 {
      font-size: 22px;
      font-weight: 800;
      color: var(--text-hover);
      margin-bottom: 12px;
      letter-spacing: 0.05em;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      font-weight: 500;
      opacity: 0.9;
    }
    .badge {
      display: inline-block;
      margin-top: 24px;
      padding: 8px 16px;
      border-radius: 9999px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 700;
      color: var(--accent);
      box-shadow: var(--shadow-raised);
      letter-spacing: 0.08em;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-box">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
    <h1>ログインが完了しました</h1>
    <p>認証プロセスが成功しました。<br>このタブを閉じてアプリ画面へお戻りください。</p>
    <div class="badge">SUCCESS</div>
  </div>
</body>
</html>`;
  }

  async login(port = 8888): Promise<AuthSession> {
    const creds = this.getClientCredentials();
    const pkce = this.createPkce();
    const redirectUri = `http://${creds.redirectHost}:${port}`;

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(creds.clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent("openid email profile https://www.googleapis.com/auth/spreadsheets.readonly")}&` +
      `state=${encodeURIComponent(pkce.state)}&` +
      `code_challenge=${encodeURIComponent(pkce.challenge)}&` +
      `code_challenge_method=S256&` +
      `access_type=offline&prompt=consent`;

    const authCode = await new Promise<string>((resolve, reject) => {
      const server = http.createServer((req, res) => {
        try {
          const reqUrl = new URL(req.url || "", redirectUri);
          const code = reqUrl.searchParams.get("code");
          const error = reqUrl.searchParams.get("error");

          if (error) {
            res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
            res.end("<h1>認証失敗</h1>");
            server.close();
            reject(new Error(`OAuth Error: ${error}`));
            return;
          }

          if (code) {
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(this.getSuccessHtml());
            server.close();
            resolve(code);
          }
        } catch (err) {
          server.close();
          reject(err);
        }
      });

      server.listen(port, () => void shell.openExternal(authUrl));
      server.on("error", (err) => reject(new Error(`Listener Error: ${err.message}`)));
    });

    const body = new URLSearchParams({
      code: authCode,
      client_id: creds.clientId,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: pkce.verifier,
    });
    if (creds.clientSecret) body.append("client_secret", creds.clientSecret);

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) throw new Error(`Token Exchange Failed: ${await res.text()}`);

    const tokenData = (await res.json()) as { access_token: string; refresh_token?: string; expires_in?: number };
    const session: AuthSession = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || "",
      expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
    };

    await this.saveSession(session);
    return session;
  }

  async refreshAccessToken(): Promise<string | null> {
    const session = await this.loadSession();
    if (!session?.refreshToken) return null;

    const creds = this.getClientCredentials();
    const body = new URLSearchParams({
      client_id: creds.clientId,
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
    });
    if (creds.clientSecret) body.append("client_secret", creds.clientSecret);

    try {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      if (!res.ok) return null;

      const data = (await res.json()) as { access_token: string; expires_in?: number };
      const updated: AuthSession = {
        ...session,
        accessToken: data.access_token,
        expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
      };

      await this.saveSession(updated);
      return data.access_token;
    } catch {
      return null;
    }
  }

  async saveSession(session: AuthSession): Promise<void> {
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, JSON.stringify(session));
  }

  async loadSession(): Promise<AuthSession | null> {
    const raw = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      await this.clearSession();
      return null;
    }
  }

  async clearSession(): Promise<void> {
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
  }
}
