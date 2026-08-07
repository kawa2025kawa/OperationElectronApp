//src\renderer\components\portal\Portal.tsx

import React from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
  containerId?: string;
}

export const Portal: React.FC<PortalProps> = ({
  children,
  containerId = "modal-root",
}) => {
  const container = document.getElementById(containerId);
  if (!container) return null;
  return createPortal(children, container);
};
