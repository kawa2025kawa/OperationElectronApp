// src/renderer/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App"; // 同階層なので ./ を使用
import "@styles/global"; // 異階層のためエイリアスを使用
import { setupAppRegistry } from "@renderer/registry/appRegistry";

setupAppRegistry();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Target container '#root' is missing in HTML.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
