"use client";

import { useEffect } from "react";
import { reportClientError } from "../lib/monitoring/client";

type AppError = Error & { digest?: string };

export default function AppErrorPage({
  error,
  reset,
}: {
  error: AppError;
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, "react.error", { digest: error.digest });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
      <section className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-sm text-white/65">
          The issue was reported automatically. Try again or return to the studio.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-200"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
