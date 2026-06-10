"use client";

import React from "react";

function isInstalledDisplayMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    window.matchMedia?.("(display-mode: fullscreen)")?.matches === true ||
    window.matchMedia?.("(display-mode: minimal-ui)")?.matches === true ||
    (window.navigator as any).standalone === true
  );
}

function applyInstalledModeFlag() {
  const installed = isInstalledDisplayMode();
  document.documentElement.dataset.pwaInstalled = installed ? "true" : "false";
  document.body.dataset.pwaInstalled = installed ? "true" : "false";
}

export default function PwaRuntime() {
  React.useEffect(() => {
    applyInstalledModeFlag();
    const media = window.matchMedia?.("(display-mode: standalone)");
    media?.addEventListener?.("change", applyInstalledModeFlag);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      const register = () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            registration.update().catch(() => {});
          })
          .catch(() => {});
      };
      const requestIdle = (window as any).requestIdleCallback as
        | ((callback: () => void) => number)
        | undefined;
      if (requestIdle) {
        requestIdle(register);
      } else {
        window.setTimeout(register, 1200);
      }
    }

    return () => {
      media?.removeEventListener?.("change", applyInstalledModeFlag);
    };
  }, []);

  return null;
}
