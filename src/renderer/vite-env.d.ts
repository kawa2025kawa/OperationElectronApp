/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly APP_VERSION?: string;
  // 他にカスタム環境変数があればここに定義
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
