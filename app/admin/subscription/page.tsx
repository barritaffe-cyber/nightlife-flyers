'use client';

import React from "react";

export default function AdminSubscriptionPage() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState("active");
  const [periodEnd, setPeriodEnd] = React.useState("");
  const [secret, setSecret] = React.useState("");
  const [msg, setMsg] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!email || !periodEnd || !secret) {
      setMsg("Email, period end, and secret are required.");
      return;
    }
    const res = await fetch("/api/admin/update-subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": secret,
      },
      body: JSON.stringify({
        email,
        status,
        current_period_end: periodEnd,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data?.error || "Update failed");
      return;
    }
    setMsg("Updated ✓");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-lg mx-auto rounded-2xl border border-white/10 bg-neutral-900 p-6">
        <h1 className="text-xl font-semibold mb-2">Admin: Subscription</h1>
        <p className="text-xs text-neutral-400 mb-4">
          Manual update for testing (replace billing later).
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
            placeholder="User email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="active">active</option>
            <option value="trial">trial</option>
            <option value="past_due">past_due</option>
            <option value="canceled">canceled</option>
          </select>
          <input
            className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
            placeholder="current_period_end (YYYY-MM-DD)"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
          <input
            className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
            placeholder="ADMIN_SECRET"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold"
          >
            Update subscription
          </button>
        </form>
        {msg && <div className="mt-3 text-xs text-neutral-300">{msg}</div>}
      </div>
    </div>
  );
}
