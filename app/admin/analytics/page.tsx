"use client";

import React from "react";
import Link from "next/link";
import { supabaseBrowser } from "../../../lib/supabase/client";

type DashboardPayload = {
  ok: boolean;
  admin_email: string | null;
  days: number;
  range_start: string;
  total_events: number;
  sampled_events: number;
  summary: Record<string, number>;
  top_sources: Array<{ label: string; count: number }>;
  top_paths: Array<{ label: string; count: number }>;
  top_landings: Array<{ label: string; count: number }>;
  recent_events: Array<{
    id: string;
    created_at: string;
    event_name: string | null;
    path: string | null;
    email: string | null;
    utm_source: string | null;
    properties: Record<string, unknown>;
  }>;
};

function formatMetricLabel(label: string) {
  return label.replace(/_/g, " ");
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

const RANGE_OPTIONS = [
  { days: 1, label: "Daily" },
  { days: 7, label: "7d" },
  { days: 30, label: "30d" },
  { days: 90, label: "90d" },
];

export default function AdminAnalyticsPage() {
  const [payload, setPayload] = React.useState<DashboardPayload | null>(null);
  const [days, setDays] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async (windowDays: number) => {
    setLoading(true);
    setError(null);

    const supabase = supabaseBrowser();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      window.location.href = "/login?next=/admin/analytics";
      return;
    }

    const res = await fetch(`/api/admin/analytics?days=${windowDays}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = (await res.json().catch(() => ({}))) as DashboardPayload & { error?: string };
    if (!res.ok) {
      setError(json?.error || "Analytics dashboard failed.");
      setPayload(null);
      setLoading(false);
      return;
    }

    setPayload(json);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load(days);
  }, [days, load]);

  return (
    <div className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-white/45">Admin</div>
            <h1 className="mt-2 text-3xl font-semibold">Analytics</h1>
            <p className="mt-2 text-sm text-white/60">
              Private funnel and traffic data for admin emails only.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.days}
                type="button"
                onClick={() => setDays(option.days)}
                className={`rounded-lg px-3 py-2 text-sm ${
                  days === option.days
                    ? "bg-fuchsia-600 text-white"
                    : "border border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                }`}
              >
                {option.label}
              </button>
            ))}
            <Link
              href="/profile"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 hover:bg-white/10"
            >
              Profile
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 text-sm text-white/70">
            Loading analytics…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-100">
            {error}
          </div>
        ) : payload ? (
          <>
            <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5 text-sm text-white/65">
              <div>Admin email: {payload.admin_email || "-"}</div>
              <div>Range: {payload.days === 1 ? "Daily / last 24 hours" : `${payload.days} days`}</div>
              <div>Range start: {formatDate(payload.range_start)}</div>
              <div>
                Events loaded: {payload.sampled_events} of {payload.total_events}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
              {Object.entries(payload.summary).map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-neutral-900 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    {formatMetricLabel(label)}
                  </div>
                  <div className="mt-3 text-3xl font-semibold">{value}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <section className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
                <h2 className="text-lg font-semibold">Top Sources</h2>
                <div className="mt-4 space-y-3 text-sm">
                  {payload.top_sources.length ? payload.top_sources.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3">
                      <span className="truncate text-white/75">{item.label}</span>
                      <span className="text-white">{item.count}</span>
                    </div>
                  )) : <div className="text-white/45">No tracked sources yet.</div>}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
                <h2 className="text-lg font-semibold">Top Paths</h2>
                <div className="mt-4 space-y-3 text-sm">
                  {payload.top_paths.length ? payload.top_paths.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3">
                      <span className="truncate text-white/75">{item.label}</span>
                      <span className="text-white">{item.count}</span>
                    </div>
                  )) : <div className="text-white/45">No tracked paths yet.</div>}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
                <h2 className="text-lg font-semibold">Top Landing Pages</h2>
                <div className="mt-4 space-y-3 text-sm">
                  {payload.top_landings.length ? payload.top_landings.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3">
                      <span className="truncate text-white/75">{item.label}</span>
                      <span className="text-white">{item.count}</span>
                    </div>
                  )) : <div className="text-white/45">No landing pages tracked yet.</div>}
                </div>
              </section>
            </div>

            <section className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
              <h2 className="text-lg font-semibold">Recent Events</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-white/45">
                    <tr>
                      <th className="pb-3 pr-4 font-medium">Time</th>
                      <th className="pb-3 pr-4 font-medium">Event</th>
                      <th className="pb-3 pr-4 font-medium">Path</th>
                      <th className="pb-3 pr-4 font-medium">User</th>
                      <th className="pb-3 pr-4 font-medium">Source</th>
                      <th className="pb-3 font-medium">Properties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payload.recent_events.map((event) => (
                      <tr key={event.id} className="border-t border-white/8 align-top">
                        <td className="py-3 pr-4 text-white/60">{formatDate(event.created_at)}</td>
                        <td className="py-3 pr-4 text-white">{event.event_name || "-"}</td>
                        <td className="py-3 pr-4 text-white/70">{event.path || "-"}</td>
                        <td className="py-3 pr-4 text-white/70">{event.email || "-"}</td>
                        <td className="py-3 pr-4 text-white/70">{event.utm_source || "-"}</td>
                        <td className="py-3 text-white/55">
                          <pre className="max-w-md overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(event.properties || {}, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
