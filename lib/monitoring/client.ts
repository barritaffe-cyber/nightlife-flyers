"use client";

type MonitoringSource =
  | "window.error"
  | "window.unhandledrejection"
  | "react.error"
  | "react.global-error";

type MonitoringMetadata = Record<string, string | number | boolean | null | undefined>;

function cleanString(value: unknown, max = 2000): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function errorToPayload(error: unknown) {
  if (error instanceof Error) {
    return {
      message: cleanString(error.message, 1000) ?? error.name,
      name: cleanString(error.name, 120),
      stack: cleanString(error.stack, 6000),
    };
  }

  if (typeof error === "string") {
    return {
      message: cleanString(error, 1000) ?? "Unknown client error",
    };
  }

  return {
    message: "Unknown client error",
    detail: cleanString(JSON.stringify(error), 2000),
  };
}

function postMonitoringPayload(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const sent = navigator.sendBeacon(
      "/api/monitoring/error",
      new Blob([body], { type: "application/json" })
    );
    if (sent) return;
  }

  void fetch("/api/monitoring/error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function reportClientError(
  error: unknown,
  source: MonitoringSource,
  metadata: MonitoringMetadata = {}
) {
  const normalized = errorToPayload(error);
  postMonitoringPayload({
    source,
    ...normalized,
    metadata,
    href: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    timestamp: new Date().toISOString(),
  });
}
