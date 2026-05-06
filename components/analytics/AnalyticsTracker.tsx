"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { trackClientEvent } from "../../lib/analytics/client";

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedRef = React.useRef<string | null>(null);
  const sessionStartedRef = React.useRef(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const currentPath = `${window.location.pathname}${window.location.search}`;
    if (lastTrackedRef.current === currentPath) return;
    lastTrackedRef.current = currentPath;

    void trackClientEvent("page_view", { path: currentPath });
    if (!sessionStartedRef.current) {
      sessionStartedRef.current = true;
      void trackClientEvent("session_started", {
        path: currentPath,
        properties: {
          visibility: document.visibilityState,
          viewport_w: window.innerWidth,
          viewport_h: window.innerHeight,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
        },
      });
    }
    if (window.location.pathname === "/pricing") {
      void trackClientEvent("pricing_view", { path: currentPath });
    }
  }, [pathname]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let stopped = false;

    const sendHeartbeat = (event = "session_heartbeat") => {
      if (stopped) return;
      const path = `${window.location.pathname}${window.location.search}`;
      void trackClientEvent(event, {
        path,
        properties: {
          visibility: document.visibilityState,
          viewport_w: window.innerWidth,
          viewport_h: window.innerHeight,
        },
      });
    };

    sendHeartbeat();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    }, 30000);

    const onVisibilityChange = () => {
      sendHeartbeat(document.visibilityState === "visible" ? "session_heartbeat" : "session_ended");
    };
    const onPageHide = () => {
      sendHeartbeat("session_ended");
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      stopped = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  return null;
}
