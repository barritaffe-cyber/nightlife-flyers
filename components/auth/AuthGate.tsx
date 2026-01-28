'use client';

import React from "react";
import { supabaseBrowser } from "../../lib/supabase/client";
import { getDeviceType, getOrCreateDeviceId } from "../../lib/auth/device";

export default function AuthGate({
  onStatusChange,
}: {
  onStatusChange?: (status: "active" | "inactive") => void;
}) {
  const [loading, setLoading] = React.useState(true);
  const [blocked, setBlocked] = React.useState<null | {
    reason: "login" | "expired" | "replace";
  }>(null);

  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (!session) {
          if (mounted) setBlocked({ reason: "login" });
          return;
        }

        const token = session.access_token;
        await fetch("/api/auth/profile-bootstrap", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        const deviceId = getOrCreateDeviceId();
        const deviceType = getDeviceType();

        const deviceRes = await fetch("/api/auth/device-check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ deviceId, deviceType }),
        });

        if (deviceRes.status === 409) {
          if (mounted) setBlocked({ reason: "replace" });
          return;
        }

        if (!deviceRes.ok) {
          if (mounted) setBlocked({ reason: "login" });
          return;
        }

        const statusRes = await fetch("/api/auth/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!statusRes.ok) {
          if (mounted) onStatusChange?.("inactive");
          if (mounted) setBlocked(null);
          return;
        }

        const status = await statusRes.json();
        if (status.status !== "active") {
          if (mounted) onStatusChange?.("inactive");
          if (mounted) setBlocked(null);
          return;
        }

        if (mounted) onStatusChange?.("active");
        if (mounted) setBlocked(null);
      } catch {
        if (mounted) setBlocked({ reason: "login" });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return null;
  if (!blocked) return null;

  return (
    <div className="fixed inset-0 z-[3000] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white shadow-2xl">
        {blocked.reason === "login" && (
          <>
            <div className="text-lg font-semibold mb-2">Login required</div>
            <div className="text-sm text-neutral-400 mb-4">
              Please log in to access your profile and subscription.
            </div>
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold"
            >
              Go to Login
            </a>
          </>
        )}

        {blocked.reason === "expired" && (
          <>
            <div className="text-lg font-semibold mb-2">Subscription inactive</div>
            <div className="text-sm text-neutral-400 mb-4">
              Your subscription is inactive or expired. Please renew to continue.
            </div>
          </>
        )}

        {blocked.reason === "replace" && (
          <>
            <div className="text-lg font-semibold mb-2">Device limit reached</div>
            <div className="text-sm text-neutral-400 mb-4">
              This device is not registered. You can replace your current device for this type.
            </div>
            <button
              className="rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold"
              onClick={async () => {
                const supabase = supabaseBrowser();
                const { data } = await supabase.auth.getSession();
                const token = data.session?.access_token;
                if (!token) {
                  window.location.href = "/login";
                  return;
                }
                const res = await fetch("/api/auth/device-check", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    deviceId: getOrCreateDeviceId(),
                    deviceType: getDeviceType(),
                    replace: true,
                  }),
                });
                if (res.ok) {
                  setBlocked(null);
                }
              }}
            >
              Replace this device
            </button>
          </>
        )}
      </div>
    </div>
  );
}
