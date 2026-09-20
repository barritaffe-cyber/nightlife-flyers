"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";

export const NIGHTLIFE_PRELOADER_MESSAGES = [
  "Loading canvas engine.",
  "Preparing template layers.",
  "Syncing type controls.",
  "Warming color tools.",
  "Checking export pipeline.",
] as const;

type NightlifePreloaderProps = {
  detail?: string;
  messages?: readonly string[];
  showCoco?: boolean;
  title?: string;
  subtitle?: string;
  surface?: "page" | "overlay" | "glass";
};

export default function NightlifePreloader({
  detail = "Creative system is coming online.",
  messages = NIGHTLIFE_PRELOADER_MESSAGES,
  showCoco = false,
  title = "COCO ONLINE",
  subtitle = "Preparing Nightlife Flyers.",
  surface = "page",
}: NightlifePreloaderProps) {
  const [messageIndex, setMessageIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((index) => (index + 1) % Math.max(1, messages.length));
    }, 1850);
    return () => window.clearInterval(timer);
  }, [messages.length]);

  const shellClass =
    surface === "overlay" || surface === "glass"
      ? "nf-coco-boot fixed inset-0 z-[1000] flex min-h-screen items-center justify-center px-5 text-white"
      : "nf-coco-boot flex min-h-screen items-center justify-center px-5 text-white";

  return (
    <div
      className={`${shellClass} ${surface === "glass" ? "nf-coco-boot-glass" : ""}`}
      data-testid={surface === "glass" ? "coco-generation-overlay" : undefined}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="nf-coco-boot-panel w-full max-w-[360px] text-center">
        {showCoco ? (
          <div className="relative mx-auto w-fit" aria-hidden="true">
            <span className="nf-startup-coco-orb-aura" />
            <span className="nf-startup-coco-orb-ring" />
            <img
              src="/branding/coco-orb.png?v=3"
              alt=""
              className="relative h-[88px] w-[88px] rounded-full object-cover shadow-[0_0_44px_rgba(103,232,249,0.24)]"
              draggable={false}
            />
            <span className="nf-coco-loader-orb absolute -bottom-2 -right-4 scale-75" />
          </div>
        ) : (
          <div className="nf-coco-loader-orb nf-coco-loader-orb-lg mx-auto" aria-hidden="true" />
        )}

        <div className="mt-7 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/[0.64]">
          {title}
        </div>
        <div className="mt-2 text-[21px] font-semibold leading-7 text-white">{subtitle}</div>
        <div className="mx-auto mt-2 max-w-[280px] text-[13px] leading-5 text-white/[0.58]">
          {detail}
        </div>

        <div className="mx-auto mt-6 flex w-full max-w-[280px] items-center justify-between gap-3 text-left">
          <div className="h-px flex-1 bg-cyan-100/12" />
          <div
            key={messageIndex}
            className="min-w-[152px] text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-50/70"
          >
            {messages[messageIndex % Math.max(1, messages.length)] ?? "Working on your flyer."}
          </div>
          <div className="h-px flex-1 bg-fuchsia-100/12" />
        </div>

        <div className="nf-coco-loader-meter mx-auto mt-6 w-44" aria-hidden="true">
          <span className="nf-coco-loader-meter-bar" />
        </div>
      </div>
    </div>
  );
}
