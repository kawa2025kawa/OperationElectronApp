// src/renderer/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";

// ローカルフォントの読み込み (起動時のチラつき防止)
import "@fontsource/noto-sans-jp/400.css";
import "@fontsource/noto-sans-jp/800.css";

import "@styles/global";
import { App } from "./App";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Target container '#root' is missing in HTML.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
