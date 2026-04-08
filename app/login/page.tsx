'use client';

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";
import { buildBillingCheckoutHref, resolveBillingSelection } from "../../lib/billing/catalog";
import PublicSiteFooter from "../../components/ui/PublicSiteFooter";

function LoginPageInner() {
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [mode, setMode] = React.useState<"login" | "signup" | "forgot" | "reset">("login");
  const [msg, setMsg] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const plan = searchParams.get("plan");
  const offer = searchParams.get("offer");
  const billing = searchParams.get("billing");
  const next = searchParams.get("next");
  const requestedMode = searchParams.get("mode");

  const selection = resolveBillingSelection({ plan, offer, billing });
  const postAuthHref = next || (selection ? buildBillingCheckoutHref(selection) : "/");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nightlife-flyers.com";

  React.useEffect(() => {
    let active = true;
    const supabase = supabaseBrowser();

    const applyResetMode = () => {
      if (active) {
        setMode("reset");
      }
    };

    const cleanupRecoveryUrl = () => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
      const hashKeysToDelete = ["access_token", "refresh_token", "expires_at", "expires_in", "token_type", "type"];
      for (const key of ["code", "token_hash", "type"]) {
        url.searchParams.delete(key);
      }
      for (const key of hashKeysToDelete) {
        hashParams.delete(key);
      }
      url.hash = hashParams.toString() ? `#${hashParams.toString()}` : "";
      window.history.replaceState({}, document.title, url.toString());
    };

    const bootstrapRecovery = async () => {
      if (requestedMode === "reset") {
        applyResetMode();
      }
      if (typeof window === "undefined") return;

      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
      const recoveryType = url.searchParams.get("type") || hashParams.get("type");
      const tokenHash = url.searchParams.get("token_hash") || hashParams.get("token_hash");
      const code = url.searchParams.get("code");

      let recovered = false;

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (active) setMsg(error.message);
          return;
        }
        recovered = true;
      } else if (recoveryType === "recovery" && tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        if (error) {
          if (active) setMsg(error.message);
          return;
        }
        recovered = true;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (recovered || (session && recoveryType === "recovery")) {
        applyResetMode();
        cleanupRecoveryUrl();
      }
    };

    void bootstrapRecovery();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        applyResetMode();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [requestedMode]);

  const intentCopy =
    offer === "night-pass"
      ? "Sign in or create an account to get a one-time Night Pass."
      : offer === "weekend-pass"
        ? "Sign in or create an account to get a one-time Weekend Pass."
        : plan === "creator"
          ? "Access your profile and start the Creator plan."
          : plan === "studio"
            ? "Access your profile and start the Studio plan."
            : "Access your profile, subscription, or on-demand pass.";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const supabase = supabaseBrowser();
    setBusy(true);
    try {
      if (mode === "forgot") {
        if (!email.trim()) {
          setMsg("Enter your account email first.");
          return;
        }
        const resetRedirect = new URL("/auth/reset", siteUrl);
        if (next) resetRedirect.searchParams.set("next", next);
        if (plan) resetRedirect.searchParams.set("plan", plan);
        if (offer) resetRedirect.searchParams.set("offer", offer);
        if (billing) resetRedirect.searchParams.set("billing", billing);
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: resetRedirect.toString(),
        });
        if (error) {
          setMsg(error.message);
        } else {
          setMsg("Check your email for the password reset link.");
        }
        return;
      }

      if (mode === "reset") {
        if (!password) {
          setMsg("Enter a new password.");
          return;
        }
        if (password.length < 6) {
          setMsg("Use at least 6 characters.");
          return;
        }
        if (password !== confirmPassword) {
          setMsg("Passwords do not match.");
          return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          setMsg(error.message);
        } else {
          setMsg("Password updated. You can log in now.");
          setPassword("");
          setConfirmPassword("");
          setMode("login");
        }
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) setMsg(error.message);
        else
          setMsg(
            selection
              ? "Check your email to confirm your account. After confirming, sign in to continue to checkout."
              : "Check your email to confirm your account."
          );
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else window.location.href = postAuthHref;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Link
        href="/"
        className="absolute left-6 top-6 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
      >
        Back to Studio
      </Link>
      <div className="flex min-h-screen items-center justify-center p-6 pb-28">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6">
        <h1 className="text-xl font-semibold mb-2">
          {mode === "login"
            ? "Login"
            : mode === "signup"
              ? "Create account"
              : mode === "forgot"
                ? "Reset password"
                : "Set new password"}
        </h1>
        <p className="text-sm text-neutral-400 mb-4">
          {mode === "forgot"
            ? "Enter your email and we will send a password reset link."
            : mode === "reset"
              ? "Choose a new password for your account."
              : intentCopy}
        </p>
        <form onSubmit={submit} className="space-y-3">
          {mode !== "reset" && (
            <input
              type="email"
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
          {mode !== "forgot" && (
            <input
              type="password"
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
              placeholder={mode === "reset" ? "New password" : "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
          {mode === "reset" && (
            <input
              type="password"
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold"
            disabled={busy}
          >
            {mode === "login"
              ? "Login"
              : mode === "signup"
                ? "Sign up"
                : mode === "forgot"
                  ? "Send reset link"
                  : "Save new password"}
          </button>
        </form>
        {msg && <div className="mt-3 text-xs text-neutral-300">{msg}</div>}
        <div className="mt-4 text-xs text-neutral-400">
          {mode === "login" && (
            <>
              New here?{" "}
              <button
                className="text-fuchsia-400 underline"
                onClick={() => setMode("signup")}
              >
                Create one
              </button>
            </>
          )}
          {mode === "signup" && (
            <>
              Already have an account?{" "}
              <button
                className="text-fuchsia-400 underline"
                onClick={() => setMode("login")}
              >
                Login
              </button>
            </>
          )}
          {mode === "forgot" && (
            <>
              Remembered it?{" "}
              <button
                className="text-fuchsia-400 underline"
                onClick={() => setMode("login")}
              >
                Back to login
              </button>
            </>
          )}
          {mode === "reset" && (
            <>
              Need another email?{" "}
              <button
                className="text-fuchsia-400 underline"
                onClick={() => setMode("forgot")}
              >
                Send a new reset link
              </button>
            </>
          )}
        </div>
        {mode === "login" && (
          <div className="mt-2 text-xs text-neutral-400">
            <button
              className="text-fuchsia-400 underline"
              onClick={() => setMode("forgot")}
            >
              Forgot password?
            </button>
          </div>
        )}
        {mode === "signup" && (
          <div className="mt-2 text-xs text-neutral-400">
            <button
              className="text-fuchsia-400 underline"
              onClick={() => setMode("forgot")}
            >
              Reset an existing password
            </button>
          </div>
        )}
        {mode === "reset" && (
          <div className="mt-2 text-xs text-neutral-400">
            Use the reset link from your email in this browser session before setting a new password.
          </div>
        )}
        {(mode === "forgot" || mode === "reset") && (
          <div className="mt-2 text-xs text-neutral-400">
            <button
              className="text-fuchsia-400 underline"
              onClick={() => setMode("login")}
            >
              Cancel
            </button>
          </div>
        )}
        <div className="mt-4 border-t border-white/10 pt-4">
          <Link
            href="/"
            className="inline-flex text-xs text-white/65 underline underline-offset-4 hover:text-white"
          >
            Continue without logging in
          </Link>
        </div>
      </div>
      </div>
      <PublicSiteFooter />
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-neutral-950" />}>
      <LoginPageInner />
    </React.Suspense>
  );
}
