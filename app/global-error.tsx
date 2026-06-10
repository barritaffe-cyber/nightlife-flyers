"use client";

import { useEffect } from "react";
import { reportClientError } from "../lib/monitoring/client";

type AppGlobalError = Error & { digest?: string };

export default function GlobalError({
  error,
  reset,
}: {
  error: AppGlobalError;
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, "react.global-error", { digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main style={{
          alignItems: "center",
          background: "#0a0a0a",
          color: "#fff",
          display: "flex",
          fontFamily: "Arial, sans-serif",
          justifyContent: "center",
          minHeight: "100vh",
          padding: 24,
          textAlign: "center",
        }}>
          <section style={{ maxWidth: 420 }}>
            <h1 style={{ fontSize: 28, margin: 0 }}>Something went wrong</h1>
            <p style={{ color: "rgba(255,255,255,0.68)", fontSize: 14, lineHeight: 1.6 }}>
              The issue was reported automatically. Try again in a moment.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                background: "#fff",
                border: 0,
                borderRadius: 8,
                color: "#000",
                cursor: "pointer",
                fontWeight: 700,
                padding: "10px 16px",
              }}
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
