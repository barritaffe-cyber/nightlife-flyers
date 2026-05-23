"use client";

import React from "react";
import Image from "next/image";

export const NIGHTLIFE_PRELOADER_MESSAGES = [
  "No more waiting on designer handoffs.",
  "Full flyer in minutes.",
  "Post and story promos start from the same design.",
  "Change the event copy without rebuilding the layout.",
  "Launch a clean promo before the room opens.",
  "Start from a finished flyer, not a blank canvas.",
  "Swap images, colors, and details when plans change.",
] as const;

type NightlifePreloaderProps = {
  title?: string;
  subtitle?: string;
  surface?: "page" | "overlay";
};

export default function NightlifePreloader({
  title = "Loading flyer templates",
  subtitle = "Getting the starter flyers ready.",
  surface = "page",
}: NightlifePreloaderProps) {
  const [messageIndex, setMessageIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((index) => (index + 1) % NIGHTLIFE_PRELOADER_MESSAGES.length);
    }, 1850);
    return () => window.clearInterval(timer);
  }, []);

  const shellClass =
    surface === "overlay"
      ? "fixed inset-0 z-[90] flex min-h-screen items-center justify-center bg-[#070709]/95 px-5 text-white backdrop-blur-md"
      : "flex min-h-screen items-center justify-center bg-[#070709] px-5 text-white";

  return (
    <div className={shellClass} role="status" aria-live="polite" aria-busy="true">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-200/35 bg-black/45 shadow-[0_0_34px_rgba(49,194,246,0.26)]">
          <Image
            src="/branding/nf-logo.png"
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 rounded-full"
            draggable={false}
          />
        </div>

        <div className="mt-6 text-2xl font-black leading-tight text-white">{title}</div>
        <div className="mt-2 text-sm leading-6 text-white/62">{subtitle}</div>

        <div className="mt-6 min-h-[58px] border border-cyan-100/14 bg-white/[0.045] px-4 py-3">
          <div className="text-[11px] font-black uppercase text-cyan-100/70">Problem solved</div>
          <div key={messageIndex} className="mt-1 text-base font-semibold leading-6 text-white">
            {NIGHTLIFE_PRELOADER_MESSAGES[messageIndex]}
          </div>
        </div>

        <div className="mx-auto mt-6 h-1 w-44 overflow-hidden bg-white/10">
          <div className="h-full w-2/5 animate-pulse bg-cyan-200 shadow-[0_0_20px_rgba(103,232,249,0.7)]" />
        </div>
      </div>
    </div>
  );
}
