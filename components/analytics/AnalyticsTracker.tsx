"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { trackClientEvent } from "../../lib/analytics/client";

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const currentPath = `${window.location.pathname}${window.location.search}`;
    if (lastTrackedRef.current === currentPath) return;
    lastTrackedRef.current = currentPath;

    void trackClientEvent("page_view", { path: currentPath });
    if (window.location.pathname === "/pricing") {
      void trackClientEvent("pricing_view", { path: currentPath });
    }
  }, [pathname]);

  return null;
}
