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

export default function AuthResetPage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = React.useState("Preparing secure password reset...");

  React.useEffect(() => {
    let active = true;
    const supabase = supabaseBrowser();

    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
        const recoveryType = url.searchParams.get("type") || hashParams.get("type");
        const tokenHash = url.searchParams.get("token_hash") || hashParams.get("token_hash");
        const code = url.searchParams.get("code");

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
        } else {
          throw new Error("The password reset link is missing recovery details.");
        }

        window.location.replace(buildLoginResetHref(searchParams));
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

    return () => {
      active = false;
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
