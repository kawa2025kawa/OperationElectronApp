// src/renderer/store/slices/themeSlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";

export interface ThemeSlice {
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
}

// アプリケーションのカラーテーマ（dark / light）を管理するスライスを生成する。
export const createThemeSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  ThemeSlice
> = (set) => ({
  theme: "dark",

  // 指定されたテーマ（dark または light）をステートに設定する。
  setTheme: (theme) =>
    set((state: AppState) => {
      state.theme = theme;
    }),

  // 現在のテーマ（dark / light）を相互に切り替える。
  toggleTheme: () =>
    set((state: AppState) => {
      state.theme = state.theme === "dark" ? "light" : "dark";
    }),
});
