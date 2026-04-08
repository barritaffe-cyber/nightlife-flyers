'use client';

import React from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "../../../lib/supabase/client";

function buildLoginResetHref(searchParams: URLSearchParams) {
  const nextUrl = new URL("/login", window.location.origin);
  nextUrl.searchParams.set("mode", "reset");

  for (const key of ["next", "plan", "offer", "billing"]) {
    const value = searchParams.get(key);
    if (value) {
      nextUrl.searchParams.set(key, value);
    }
  }

  return nextUrl.toString();
}

async function waitForRecoverySession(supabase: ReturnType<typeof supabaseBrowser>, attempts = 12) {
  for (let index = 0; index < attempts; index += 1) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      return session;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 200));
  }
  return null;
}

function AuthResetPageInner() {
  const searchParams = useSearchParams();
  const [message, setMessage] = React.useState("Preparing secure password reset...");

  React.useEffect(() => {
    let active = true;
    const supabase = supabaseBrowser();
    const redirectToResetForm = () => {
      window.location.replace(buildLoginResetHref(searchParams));
    };

    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
        const recoveryType = url.searchParams.get("type") || hashParams.get("type");
        const tokenHash = url.searchParams.get("token_hash") || hashParams.get("token_hash");
        const code = url.searchParams.get("code");
        const hasRecoveryTokens = Boolean(hashParams.get("access_token") || hashParams.get("refresh_token"));

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }
        } else if (recoveryType === "recovery" && tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          if (error) {
            throw error;
          }
        } else if (recoveryType === "recovery" && hasRecoveryTokens) {
          const session = await waitForRecoverySession(supabase);
          if (!session) {
            throw new Error("The password reset session could not be established.");
          }
        } else {
          throw new Error("The password reset link is missing recovery details.");
        }

        redirectToResetForm();
      } catch (error) {
        const text =
          error instanceof Error && error.message.trim()
            ? error.message.trim()
            : "The password reset link is invalid or has expired.";
        if (active) {
          setMessage(text);
        }
      }
    };

    void run();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        redirectToResetForm();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6">
          <h1 className="mb-2 text-xl font-semibold">Password Reset</h1>
          <p className="text-sm text-neutral-400">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default function AuthResetPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-white">
          <div className="flex min-h-screen items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6">
              <h1 className="mb-2 text-xl font-semibold">Password Reset</h1>
              <p className="text-sm text-neutral-400">Preparing secure password reset...</p>
            </div>
          </div>
        </div>
      }
    >
      <AuthResetPageInner />
    </React.Suspense>
  );
}
