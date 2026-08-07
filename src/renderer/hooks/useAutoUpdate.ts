export const useAutoUpdate = () => {
  const checkForUpdates = async () => {
    console.log("[AutoUpdate] Electron update check skipped for now.");
  };

  return { checkForUpdates };
};