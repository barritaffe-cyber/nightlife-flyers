'use client';

import React from "react";
import Link from "next/link";
import Script from "next/script";
import { useSearchParams } from "next/navigation";
import { trackClientEvent, trackMetaPixelEvent } from "../../lib/analytics/client";
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
  const intent = searchParams.get("intent");
  const requestedMode = searchParams.get("mode");
  const requestedEmail = searchParams.get("email");
  const emailPrefilledRef = React.useRef(false);

  const selection = resolveBillingSelection({ plan, offer, billing });
  const postAuthHref = next || (selection ? buildBillingCheckoutHref(selection) : "/");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nightlife-flyers.com";
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
  const isStudioPreviewIntent = intent === "studio-preview";

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
      } else if (requestedMode === "signup") {
        setMode("signup");
      } else if (requestedMode === "login") {
        setMode("login");
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
        recovered = recoveryType === "recovery" || requestedMode === "reset";

        if (!recovered) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) {
            if (active) setMsg("Could not complete login. Try again.");
            return;
          }
          await trackClientEvent("login_succeeded", {
            properties: {
              destination: postAuthHref,
              method: "oauth",
              intent: intent || null,
            },
          });
          cleanupRecoveryUrl();
          window.location.href = postAuthHref;
          return;
        }
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
  }, [intent, postAuthHref, requestedMode]);

  React.useEffect(() => {
    if (emailPrefilledRef.current) return;
    const nextEmail = String(requestedEmail || "").trim();
    if (!nextEmail) return;
    emailPrefilledRef.current = true;
    setEmail(nextEmail);
  }, [requestedEmail]);

  const intentCopy =
    isStudioPreviewIntent
      ? "Create your workstation profile to start your preview."
      : offer === "night-pass"
        ? "Sign in or create an account to get a one-time Night Pass."
        : offer === "weekend-pass"
          ? "Sign in or create an account to get a one-time Weekend Pass."
          : next === "/pricing"
            ? "Log in or create an account, then choose the plan that fits this flyer."
            : plan === "creator"
              ? "Access your profile and start the Creator plan."
              : plan === "studio"
                ? "Access your profile and start the Studio plan."
                : "Access your profile, subscription, or on-demand pass.";

  const oauthRedirectTo = React.useMemo(() => {
    const redirectUrl = new URL("/login", siteUrl);
    if (next) redirectUrl.searchParams.set("next", next);
    if (intent) redirectUrl.searchParams.set("intent", intent);
    if (plan) redirectUrl.searchParams.set("plan", plan);
    if (offer) redirectUrl.searchParams.set("offer", offer);
    if (billing) redirectUrl.searchParams.set("billing", billing);
    return redirectUrl.toString();
  }, [billing, intent, next, offer, plan, siteUrl]);

  const startOAuth = async (provider: "google" | "facebook") => {
    setMsg(null);
    setBusy(true);
    try {
      trackMetaPixelEvent("CompleteRegistration", {
        method: provider,
        intent: intent || "auth",
      });
      void trackClientEvent("signup_started", {
        properties: {
          method: provider,
          intent: intent || null,
          destination: postAuthHref,
          plan: selection?.kind === "plan" ? selection.plan : null,
          offer: selection?.kind === "offer" ? selection.offer : null,
          billing: selection?.kind === "plan" ? selection.billing : null,
        },
      });

      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: oauthRedirectTo,
        },
      });
      if (error) {
        setMsg(error.message);
        setBusy(false);
      }
    } catch (error) {
      setMsg(error instanceof Error ? error.message : "Could not start login.");
      setBusy(false);
    }
  };

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
        await trackClientEvent("signup_started", {
          properties: {
            plan: selection?.kind === "plan" ? selection.plan : null,
            offer: selection?.kind === "offer" ? selection.offer : null,
            billing: selection?.kind === "plan" ? selection.billing : null,
          },
        });
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) setMsg(error.message);
        else {
          await trackClientEvent("signup_requested", {
            properties: {
              plan: selection?.kind === "plan" ? selection.plan : null,
              offer: selection?.kind === "offer" ? selection.offer : null,
              billing: selection?.kind === "plan" ? selection.billing : null,
            },
          });
          setMsg(
            selection
              ? "Check your email to confirm your account. After confirming, sign in to continue to checkout."
              : "Check your email to confirm your account."
          );
        }
        return;
      }

      await trackClientEvent("login_started", {
        properties: {
          plan: selection?.kind === "plan" ? selection.plan : null,
          offer: selection?.kind === "offer" ? selection.offer : null,
          billing: selection?.kind === "plan" ? selection.billing : null,
        },
      });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else {
        await trackClientEvent("login_succeeded", {
          properties: {
            destination: postAuthHref,
          },
        });
        window.location.href = postAuthHref;
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {metaPixelId ? (
        <Script
          id="meta-pixel-login"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      ) : null}
      <Link
        href={isStudioPreviewIntent ? "/landing" : "/"}
        className="absolute left-6 top-6 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
      >
        {isStudioPreviewIntent ? "Back to Landing" : "Back to Studio"}
      </Link>
      <div className="flex min-h-screen items-center justify-center p-6 pb-28">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6">
        <h1 className="text-xl font-semibold mb-2">
          {isStudioPreviewIntent && mode !== "forgot" && mode !== "reset"
            ? "Create your workstation profile"
            : mode === "login"
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
        {mode !== "forgot" && mode !== "reset" && (
          <div className="mb-4 space-y-2">
            <button
              type="button"
              className="flex w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-100 disabled:opacity-60"
              disabled={busy}
              onClick={() => void startOAuth("google")}
            >
              Continue with Google
            </button>
            <button
              type="button"
              className="block w-full text-center text-[11px] text-white/55 underline underline-offset-4 transition hover:text-cyan-100"
              onClick={() => setMode("signup")}
            >
              Other login options coming soon&mdash;Sign up in 5 seconds.
            </button>
            <div className="flex items-center gap-3 pt-1 text-[10px] uppercase tracking-[0.18em] text-white/35">
              <span className="h-px flex-1 bg-white/10" />
              Email
              <span className="h-px flex-1 bg-white/10" />
            </div>
          </div>
        )}
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
        {!isStudioPreviewIntent && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <Link
              href="/"
              className="inline-flex text-xs text-white/65 underline underline-offset-4 hover:text-white"
            >
              Continue without logging in
            </Link>
          </div>
        )}
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
