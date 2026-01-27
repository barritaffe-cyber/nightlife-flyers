'use client';

import React from "react";
import { supabaseBrowser } from "../../lib/supabase/client";

export default function ProfilePage() {
  const [email, setEmail] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = React.useState<string | null>(null);

  React.useEffect(() => {
    const run = async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const res = await fetch("/api/auth/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setEmail(json.email || data.session?.user?.email || null);
      setStatus(json.status || "inactive");
      setPeriodEnd(json.current_period_end || null);
    };
    run();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Profile</h1>
        <div className="rounded-xl border border-white/10 bg-neutral-900 p-4 space-y-2 text-sm">
          <div>Email: {email ?? "-"}</div>
          <div>Status: {status ?? "-"}</div>
          <div>Expires: {periodEnd ? new Date(periodEnd).toDateString() : "-"}</div>
        </div>
      </div>
    </div>
  );
}
