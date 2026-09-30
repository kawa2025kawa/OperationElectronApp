// src/renderer/services/commands/authCommands.ts

export const authCommands = {
  loadAuthSession(forceRefresh = false) {
    return window.electronAPI.invoke("googleAuth:loadSession", forceRefresh);
  },

  login() {
    return window.electronAPI.invoke("googleAuth:login");
  },

  logout() {
    return window.electronAPI.invoke("googleAuth:logout");
  },
} as const;
