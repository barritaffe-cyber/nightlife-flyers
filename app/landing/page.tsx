"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Shield, Sparkles, Zap } from "lucide-react";
import PublicSiteFooter from "../../components/ui/PublicSiteFooter";
import {
  getPublicSupportPhone,
  getPublicTransactionCurrency,
} from "../../lib/publicIdentity";

const outcomes = [
  "Try the studio before login",
  "Edit text, color, flares, and glitch type",
  "Export or save when you are ready",
];

const premiumPoints = [
  {
    title: "Real-time studio feel",
    body: "Fast editing, live canvas previews, and export-ready flyer layouts built for tonight's promo cycle.",
    icon: Zap,
  },
  {
    title: "Nightlife-grade visuals",
    body: "Neon type, club lighting, artist-forward compositions, and templates that feel made for flyers.",
    icon: Sparkles,
  },
  {
    title: "Total Creative Autonomy",
    body: "No more waiting on designers. No more back-and-forth emails. You own the engine and control the output.",
    icon: ArrowRight,
  },
  {
    title: "No subscription required",
    body: "Start with Night Pass for one-off work, then move into Creator or Studio when volume picks up.",
    icon: Shield,
  },
];

const studioPreviewHref = "/?studio=1";

export default function LandingPage() {
  const supportPhone = getPublicSupportPhone();
  const currency = getPublicTransactionCurrency();
  const [foundingRemaining, setFoundingRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const loadFoundingOffer = async () => {
      try {
        const res = await fetch("/api/billing/founding-offer");
        const json = await res.json().catch(() => null);
        const remaining = Number(json?.remaining_slots);
        if (!cancelled && res.ok && Number.isFinite(remaining)) {
          setFoundingRemaining(Math.max(0, remaining));
        }
      } catch {}
    };

    void loadFoundingOffer();
    return () => {
      cancelled = true;
    };
  }, []);

  const foundingStatus =
    foundingRemaining == null
      ? "Founding 50 Status: limited spots remaining."
      : `Founding 50 Status: ${foundingRemaining} spots remaining.`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050608] text-white">
      <section className="relative min-h-[640px] overflow-hidden sm:min-h-[720px] lg:min-h-[760px]">
        <div className="absolute inset-0">
          <video
            className="h-full w-full object-cover object-center opacity-[0.86] brightness-[0.82] saturate-[1.16]"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/landing/meta-ad-preview-poster.jpg"
          >
            <source src="/landing/meta-ad-preview.mp4" type="video/mp4" />
          </video>
          <Image
            src="/landing/meta-ad-preview-poster.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,8,0.92)_0%,rgba(5,6,8,0.68)_42%,rgba(5,6,8,0.26)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,8,0.48)_0%,rgba(5,6,8,0.08)_38%,#050608_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(0,229,255,0.18)_0%,rgba(255,43,214,0.10)_30%,rgba(5,6,8,0)_60%)]" />

        <header className="relative z-20">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <Link
              href="/landing"
              className="inline-flex items-center gap-2 drop-shadow-[0_2px_18px_rgba(0,0,0,0.75)]"
              aria-label="Nightlife Flyers home"
            >
              <Image
                src="/branding/nf-logo.png"
                alt="Nightlife Flyers"
                width={48}
                height={48}
                className="h-10 w-10 rounded-full ring-1 ring-cyan-100/45 shadow-[0_0_28px_rgba(103,232,249,0.28)] sm:h-12 sm:w-12"
                priority
              />
              <span
                className="hidden text-xs tracking-[0.24em] text-white sm:block"
                style={{ fontFamily: '"LEMONMILK-Bold", "Segoe UI", sans-serif' }}
              >
                NIGHTLIFE FLYERS
              </span>
            </Link>
            <div className="flex items-center gap-2 drop-shadow-[0_2px_18px_rgba(0,0,0,0.75)]">
              <Link
                href="/pricing"
                className="rounded-lg border border-white/18 bg-black/24 px-3 py-2 text-xs font-semibold text-white/86 backdrop-blur-md transition hover:border-white/35 hover:bg-black/34"
              >
                Pricing
              </Link>
              <Link
                href={studioPreviewHref}
                className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-black transition hover:bg-cyan-100"
              >
                Try Studio
              </Link>
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[560px] w-full max-w-7xl items-center px-4 pb-12 pt-8 sm:min-h-[640px] sm:px-6 lg:min-h-[680px]">
          <div className="w-full max-w-3xl">
              <Link
                href="/billing/checkout?plan=creator&billing=monthly"
                className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 border border-cyan-200/20 bg-cyan-300/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase leading-5 tracking-[0.12em] text-cyan-100 backdrop-blur-sm transition hover:border-cyan-100/40 hover:bg-cyan-300/[0.12] sm:text-[11px] sm:tracking-[0.16em]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.9)]" />
                {foundingStatus}
              </Link>

              <h1
                className="mt-4 max-w-3xl text-[2.9rem] leading-[0.9] text-white sm:mt-5 sm:text-6xl lg:text-7xl"
                style={{ fontFamily: '"Nexa-Heavy", "Segoe UI", sans-serif' }}
              >
                Try the Neural Flyer Studio Before You Sign Up.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-white/78 sm:mt-5 sm:text-lg">
                Open the workstation, touch the design, change the look, then sign in only when you are ready to export or save.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row">
                <Link
                  href={studioPreviewHref}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 text-sm font-black text-black shadow-[0_0_34px_rgba(103,232,249,0.24)] transition hover:bg-white"
                >
                  Try Studio Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/billing/checkout?plan=creator&billing=monthly"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/18 bg-white/[0.05] px-5 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/[0.09]"
                >
                  Secure Founding Spot
                </Link>
              </div>

            <div className="mt-6 grid gap-2 border-y border-white/10 py-4 text-sm text-white/78 sm:mt-8 sm:max-w-xl sm:grid-cols-3 sm:border-y-0 sm:py-0">
              {outcomes.map((item) => (
                <div key={item} className="flex items-center gap-2 sm:items-start">
                  <Check className="h-4 w-4 shrink-0 text-cyan-200" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#080a0f] px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
              From idea to post
            </div>
            <h2
              className="mt-3 text-3xl leading-tight sm:text-4xl"
              style={{ fontFamily: '"Nexa-Heavy", "Segoe UI", sans-serif' }}
            >
              Keep the same premium energy from upload to export.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {premiumPoints.map((item) => (
              <div key={item.title} className="border border-white/10 bg-white/[0.035] p-4">
                <item.icon className="h-5 w-5 text-cyan-200" />
                <h3 className="mt-3 text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/64">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.76fr)] lg:items-start">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-fuchsia-200/80">
                Access
              </div>
              <h2
                className="mt-3 max-w-3xl text-3xl leading-tight sm:text-4xl"
                style={{ fontFamily: '"Nexa-Heavy", "Segoe UI", sans-serif' }}
              >
                Start small for tonight. Upgrade when flyers become weekly.
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.76fr)] lg:items-start">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  name: "Night Pass",
                  price: "$12",
                  body: "24-hour paid workflow for one-off flyers. No subscription required.",
                  href: "/billing/checkout?offer=night-pass",
                  founding: false,
                },
                {
                  name: "Creator",
                  price: "$19/mo",
                  body: "Weekly flyer production with clean exports.",
                  href: "/billing/checkout?plan=creator&billing=monthly",
                  founding: true,
                },
                {
                  name: "Studio",
                  price: "$39/mo",
                  body: "Higher volume, more headroom, and multi-brand tools.",
                  href: "/billing/checkout?plan=studio&billing=monthly",
                  founding: true,
                },
              ].map(({ name, price, body, href, founding }) => (
                <Link
                  key={name}
                  href={href}
                  className="border border-white/10 bg-white/[0.035] p-4 transition hover:border-cyan-200/40 hover:bg-white/[0.06]"
                >
                  <div className="flex min-h-6 items-start justify-between gap-2">
                    <div className="text-sm font-semibold text-white">{name}</div>
                    {founding ? (
                      <div className="rounded-full border border-cyan-200/25 bg-cyan-300/[0.12] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-cyan-100">
                        Founding 50
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-3 text-3xl font-black text-white">{price}</div>
                  {founding ? (
                    <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100/80">
                      {foundingRemaining == null
                        ? "20% founding access available"
                        : `${foundingRemaining} founder spots remain`}
                    </div>
                  ) : null}
                  <p className="mt-2 text-sm leading-6 text-white/64">{body}</p>
                </Link>
              ))}
            </div>

            <div className="border border-white/10 bg-white/[0.025] p-5 text-sm text-white/68">
              <div className="space-y-3 leading-6">
                <div>Digital flyer-design service with instant account access after successful payment.</div>
                <div>Transaction currency: {currency}.</div>
                <div>
                  Support:{" "}
                  <Link href="/contact" className="text-white underline underline-offset-4">
                    Contact us
                  </Link>
                  {supportPhone ? <span>{` · ${supportPhone}`}</span> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
