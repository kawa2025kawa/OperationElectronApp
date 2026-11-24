// electron/features/auth/googleApiClient.ts

import { authService } from "./authService";

// Google認証に関するエラーを表す
export class GoogleAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleAuthError";
  }
}

export interface GoogleApiRequestOptions extends RequestInit {
  retryOnUnauthorized?: boolean;
}

// 認証トークンを付与してGoogle APIへ送信する
async function fetchWithToken(
  url: string,
  init: RequestInit,
  accessToken: string,
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("Accept", "application/json");

  return fetch(url, { ...init, headers });
}

// Google APIへ認証済みリクエストを送信する（401時は1回だけトークン更新してリトライ）
export async function googleApiRequest(
  url: string,
  init: GoogleApiRequestOptions = {},
): Promise<Response> {
  const { retryOnUnauthorized = true, ...requestInit } = init;
  let session = await authService.loadSession();

  if (!session) {
    throw new GoogleAuthError("Google認証セッションが存在しません");
  }

  const response = await fetchWithToken(
    url,
    requestInit,
    session.accessToken,
  );

  if (response.status !== 401 || !retryOnUnauthorized) {
    return response;
  }

  session = await authService.refreshSessionFor(session);
  if (!session) {
    throw new GoogleAuthError("Google認証セッションの更新に失敗しました");
  }

  return fetchWithToken(url, requestInit, session.accessToken);
}

// Google APIのレスポンスをJSONとして取得する
export async function googleApiGetJson<T>(
  url: string,
  init: GoogleApiRequestOptions = {},
): Promise<T> {
  const response = await googleApiRequest(url, init);
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`Google API Error (${response.status}): ${responseText}`);
  }

  try {
    return JSON.parse(responseText) as T;
  } catch (error) {
    throw new Error("Google API response is not valid JSON", {
      cause: error,
    });
  }
}
