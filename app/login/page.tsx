'use client';

import React from "react";
import { supabaseBrowser } from "../../lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [msg, setMsg] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const supabase = supabaseBrowser();
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMsg(error.message);
      else setMsg("Check your email to confirm your account.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message);
    else window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6">
        <h1 className="text-xl font-semibold mb-2">
          {mode === "login" ? "Login" : "Create account"}
        </h1>
        <p className="text-sm text-neutral-400 mb-4">
          Access your profile and subscription.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold"
          >
            {mode === "login" ? "Login" : "Sign up"}
          </button>
        </form>
        {msg && <div className="mt-3 text-xs text-neutral-300">{msg}</div>}
        <div className="mt-4 text-xs text-neutral-400">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button
            className="text-fuchsia-400 underline"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Create one" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
