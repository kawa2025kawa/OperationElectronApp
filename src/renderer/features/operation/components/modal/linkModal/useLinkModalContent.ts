import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { commands } from "@renderer/services/commands";

export function useLinkModalContent(link?: Record<string, string> | null) {
  // オブジェクトのエントリ配列化（引数が変わった時のみ再計算）
  const linkEntries = useMemo(() => {
    if (!link) return [];
    return Object.entries(link);
  }, [link]);

  // URL・パスを外部アプリケーション/ブラウザで開く
  const handleOpenUrl = useCallback(async (rawUrl: string) => {
    const trimmedUrl = rawUrl.trim();
    if (!trimmedUrl) {
      toast.error("有効なパスまたはURLが存在しません。");
      return;
    }

    try {
      await commands.openExternal(trimmedUrl);
    } catch (error) {
      console.error("[useLinkModalContent.handleOpenUrl] Failed:", error);
      toast.error("指定のパスが開けませんでした。");
    }
  }, []);

  return {
    state: {
      linkEntries,
      isEmpty: linkEntries.length === 0,
    },
    actions: {
      handleOpenUrl,
    },
  };
}
