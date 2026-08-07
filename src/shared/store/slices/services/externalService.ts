// src/shared/store/slices/services/externalService.ts
export const externalService = {
  async openExternalLink(urlOrPath: string): Promise<void> {
    console.log(`[externalService.openExternalLink] URL/Path: ${urlOrPath}`);
    try {
      if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
        window.open(urlOrPath, "_blank");
      } else {
        await window.electronAPI.invoke("openExternal", { urlOrPath });
      }
    } catch (error) {
      console.error(`[externalService.openExternalLink] Error: ${urlOrPath}`, error);
      throw error;
    }
  },
};
