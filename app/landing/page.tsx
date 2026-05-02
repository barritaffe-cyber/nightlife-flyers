"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Shield, Sparkles, Zap } from "lucide-react";
import PaymentMarks from "../../components/ui/PaymentMarks";
import PublicSiteFooter from "../../components/ui/PublicSiteFooter";
import {
  getPublicSupportPhone,
  getPublicTransactionCurrency,
} from "../../lib/publicIdentity";

const outcomes = [
  "Advanced Neural Workstation",
  "No subscription required",
  "Clean square and story exports",
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
      <div className="pointer-events-none absolute inset-0">
        <div className="relative h-[430px] overflow-hidden sm:h-[500px] lg:h-[540px]">
          <Image
            src="/DJ/club01.jpg"
            alt="Packed nightlife party with stage lights and crowd energy"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_42%] opacity-[0.92] brightness-[0.72] saturate-[1.08]"
          />
        </div>
        <div className="absolute inset-x-0 top-0 h-[640px] bg-[linear-gradient(180deg,rgba(5,6,8,0.08)_0%,rgba(5,6,8,0.36)_46%,#050608_92%)]" />
        <div className="absolute inset-x-0 top-[300px] h-[360px] bg-gradient-to-b from-transparent via-[#050608]/90 to-[#050608]" />
        <div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,rgba(5,6,8,0.96)_0%,rgba(5,6,8,0.76)_44%,rgba(5,6,8,0.34)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent" />
      </div>

      <div className="relative z-10">
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-md">
          <Link
            href="/billing/checkout?plan=creator&billing=monthly"
            className="block border-b border-cyan-200/15 bg-cyan-300/[0.11] px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-50 transition hover:bg-cyan-300/[0.16]"
          >
            {foundingStatus} Secure lifetime prestige access.
          </Link>
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image
                src="/branding/nf-logo.png"
                alt="Nightlife Flyers"
                width={34}
                height={34}
                className="rounded-md"
                priority
              />
              <span
                className="text-sm tracking-[0.2em] text-white"
                style={{ fontFamily: '"LEMONMILK-Bold", "Segoe UI", sans-serif' }}
              >
                NIGHTLIFE FLYERS
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/pricing"
                className="rounded-lg border border-white/18 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/86 transition hover:border-white/35 hover:bg-white/[0.08]"
              >
                Pricing
              </Link>
              <Link
                href="/?studio=1"
                className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-black transition hover:bg-cyan-100"
              >
                Enter Studio
              </Link>
            </div>
          </div>
        </header>

        <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-[170px] sm:px-6 sm:pb-14 sm:pt-[210px] lg:pt-[245px]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.9)]" />
              Advanced neural flyer workstation
            </div>

            <h1
              className="mt-5 max-w-2xl text-5xl leading-[0.94] text-white sm:text-6xl lg:text-7xl"
              style={{ fontFamily: '"Nexa-Heavy", "Segoe UI", sans-serif' }}
            >
              The Evolution of the Flyer Starts Here.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/76 sm:text-lg">
              Make the flyer look as expensive as the night. Remove the pain from flyer design, do it your way, on your own time.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/billing/checkout?plan=creator&billing=monthly"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 text-sm font-black text-black shadow-[0_0_34px_rgba(103,232,249,0.34)] transition hover:bg-white"
              >
                Secure My Founding Spot
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/?studio=1"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/18 bg-white/[0.06] px-5 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/[0.1]"
              >
                Enter the Studio
              </Link>
            </div>

            <div className="mt-7 grid max-w-xl gap-2 text-sm text-white/82 sm:grid-cols-3">
              {outcomes.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-cyan-200" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto hidden w-[min(92vw,1180px)] grid-cols-4 border-y border-white/10 bg-black/28 text-white/78 backdrop-blur-md lg:grid">
          {premiumPoints.map((item) => (
            <div key={item.title} className="border-r border-white/10 px-5 py-4 last:border-r-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <item.icon className="h-4 w-4 text-cyan-200" />
                {item.title}
              </div>
              <p className="mt-1 text-xs leading-5 text-white/62">{item.body}</p>
            </div>
          ))}
        </section>
      </div>

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
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-start">
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
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
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
          </div>

          <div className="border border-white/10 bg-white/[0.035] p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-white/45">Accepted Payments</div>
            <div className="mt-3">
              <PaymentMarks compact />
            </div>
            <div className="mt-5 space-y-2 text-xs leading-5 text-white/62">
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
      </section>

      <PublicSiteFooter />
    </main>
  );
}
