// src/renderer/hooks/useTheme.ts
import { useEffect, useState } from "react";
import { darkThemeClass, lightThemeClass } from "@renderer/styles/tokens";

type Theme = "dark" | "light";

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // 1. ローカルストレージに保存された設定があれば優先
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved === "dark" || saved === "light") {
      return saved;
    }
    // 2. なければデフォルトはダークテーマ
    return "dark";
  });

  useEffect(() => {
    // テーマ設定をローカルストレージへ保存
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    // Electron IPC: OSのテーマ変更をリアルタイム監視
    let cleanup: (() => void) | undefined;

    try {
      cleanup = window.electronAPI.on?.("theme-changed", (newTheme) => {
        const saved = localStorage.getItem("theme");
        // ユーザーが手動変更指定していない場合のみ、OSの変更に追従
        if (!saved && (newTheme === "dark" || newTheme === "light")) {
          setTheme(newTheme);
        }
      });
    } catch (err) {
      console.error("[useTheme] Electron Theme listener error:", err);
    }

    return () => {
      cleanup?.();
    };
  }, []);

  return {
    theme,
    themeClass: theme === "dark" ? darkThemeClass : lightThemeClass,
    setTheme,
  };
};
