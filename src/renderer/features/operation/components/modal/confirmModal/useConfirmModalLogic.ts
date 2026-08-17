import { useEffect, useMemo } from "react";

interface UseConfirmModalLogicParams {
  url?: string | null;
  baseUrl?: string;
  registerPrimaryAction: (action?: () => void | Promise<void>) => void;
}

export const useConfirmModalLogic = ({
  url,
  baseUrl,
  registerPrimaryAction,
}: UseConfirmModalLogicParams) => {
  const finalUrl = useMemo(() => {
    if (!url) return "";
    return baseUrl ? `${baseUrl}${encodeURIComponent(url)}` : url;
  }, [url, baseUrl]);

  const hasUrl = Boolean(finalUrl);

  useEffect(() => {
    registerPrimaryAction(
      hasUrl
        ? () => {
            window.open(finalUrl, "_blank", "noopener,noreferrer");
          }
        : undefined,
    );
    return () => {
      registerPrimaryAction(undefined);
    };
  }, [finalUrl, hasUrl, registerPrimaryAction]);

  return {
    finalUrl,
    hasUrl,
  };
};

export default useConfirmModalLogic;
