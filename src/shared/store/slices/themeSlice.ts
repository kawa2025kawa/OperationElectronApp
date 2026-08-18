// src/shared/store/slices/themeSlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@shared/store";

export interface ThemeSlice {
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
}

export const createThemeSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  ThemeSlice
> = (set) => ({
  theme: "dark",

  setTheme: (theme) =>
    set((state: AppState) => {
      state.theme = theme;
    }),

  toggleTheme: () =>
    set((state: AppState) => {
      state.theme = state.theme === "dark" ? "light" : "dark";
    }),
});
