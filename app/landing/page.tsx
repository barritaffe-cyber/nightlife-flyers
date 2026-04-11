"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PaymentMarks from "../../components/ui/PaymentMarks";
import PublicSiteFooter from "../../components/ui/PublicSiteFooter";
import {
  getPublicSupportPhone,
  getPublicTransactionCurrency,
} from "../../lib/publicIdentity";

export default function LandingPage() {
  const [format, setFormat] = React.useState<"square" | "story">("story");
  const [glow, setGlow] = React.useState(58);

  const glowAlpha = Math.min(0.6, 0.16 + glow / 180);
  const supportPhone = getPublicSupportPhone();
  const currency = getPublicTransactionCurrency();

  return (
    <main className="nf-landing relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(217,70,239,0.2),transparent_40%),radial-gradient(circle_at_84%_10%,rgba(6,182,212,0.18),transparent_42%),radial-gradient(circle_at_52%_86%,rgba(99,102,241,0.12),transparent_44%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:52px_52px]" />

      <header className="relative z-20 border-b border-white/10 bg-neutral-950/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/branding/nf-logo.png" alt="Nightlife Flyers" width={30} height={30} className="rounded-md" />
            <span
              className="text-sm tracking-[0.18em] text-white/90"
              style={{ fontFamily: '"LEMONMILK-Bold", "Segoe UI", sans-serif' }}
            >
              NIGHTLIFE FLYERS
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/85 transition hover:border-white/30 hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="/"
              className="rounded-lg bg-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-fuchsia-400"
            >
              Enter Studio
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-57px)] w-full max-w-6xl flex-col justify-center px-4 pb-12 pt-10 sm:px-6">
        <div className="mx-auto w-full max-w-4xl text-center nf-fade-in-up">
          <h1
            className="text-3xl leading-tight sm:text-5xl"
            style={{ fontFamily: '"Nexa-Heavy", "Segoe UI", sans-serif' }}
          >
            Watch It. Open Studio. Post Tonight.
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm text-white/72 sm:text-base">
            Template to AI background to blend to export, all in one flow.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex rounded-lg border border-white/15 bg-white/[0.04] p-1 text-[11px]">
              <button
                type="button"
                onClick={() => setFormat("square")}
                className={`rounded-md px-2.5 py-1 transition ${format === "square" ? "bg-white text-black" : "text-white/75"}`}
              >
                Square
              </button>
              <button
                type="button"
                onClick={() => setFormat("story")}
                className={`rounded-md px-2.5 py-1 transition ${format === "story" ? "bg-white text-black" : "text-white/75"}`}
              >
                Story
              </button>
            </div>

            <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-2 py-1 text-[11px]">
              <span className="text-white/70">Glow</span>
              <input
                type="range"
                min={0}
                max={100}
                value={glow}
                onChange={(e) => setGlow(Number(e.target.value))}
                className="w-24 accent-fuchsia-400"
              />
              <span className="w-7 text-right text-white">{glow}</span>
            </div>
          </div>
        </div>

        <div className="relative mx-auto mt-7 w-full max-w-4xl nf-fade-in-up [animation-delay:150ms]">
          <div className="nf-slow-strobe pointer-events-none absolute -left-16 -top-14 h-40 w-40 rounded-full bg-fuchsia-500/35 blur-3xl" />
          <div className="nf-slow-strobe-cyan pointer-events-none absolute -bottom-10 -right-12 h-36 w-36 rounded-full bg-cyan-400/30 blur-3xl" />

          <div className="relative rounded-3xl border border-white/15 bg-[#10141b]/90 p-3 shadow-[0_35px_90px_rgba(0,0,0,0.65)] sm:p-4">
            <div
              className={`overflow-hidden rounded-2xl border border-white/15 bg-black/60 ${
                format === "square" ? "aspect-square" : "aspect-[4/5] sm:aspect-video"
              }`}
              style={{
                boxShadow: `0 0 ${16 + glow * 0.75}px rgba(217,70,239,${glowAlpha}), 0 0 ${24 + glow * 0.48}px rgba(6,182,212,${
                  glowAlpha * 0.68
                })`,
              }}
            >
              <div className="relative h-full w-full">
                <video
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster="/templates/edm_stage_co2.jpg"
                >
                  <source src="/landing/hero-demo.mp4" type="video/mp4" />
                </video>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(217,70,239,0.32),transparent_45%),radial-gradient(circle_at_84%_14%,rgba(6,182,212,0.3),transparent_42%)]" />
                <div className="pointer-events-none absolute left-2 top-2 rounded-md border border-white/20 bg-black/45 px-2 py-1 text-[10px] uppercase tracking-wider text-white/85">
                  Live Studio Demo
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] text-white/65">
                Video path: <code className="rounded bg-white/10 px-1 py-0.5 text-white">public/landing/hero-demo.mp4</code>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-lg bg-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-fuchsia-400"
              >
                Open Studio
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-6 w-full max-w-4xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/72">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.22em] text-white/45">Accepted Payments</div>
              <PaymentMarks compact />
            </div>
            <div className="max-w-xl space-y-1 text-xs text-white/62">
              <div>Digital flyer-design service with instant account access after successful payment.</div>
              <div>Transaction currency: {currency}.</div>
              <div>Refunds, cancellation, privacy, and delivery terms are posted in Terms and Privacy.</div>
              <div>
                Support: <Link href="/contact" className="text-white underline underline-offset-4">Contact us</Link>
                {supportPhone ? <span>{` · ${supportPhone}`}</span> : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10">
        <PublicSiteFooter />
      </div>
    </main>
  );
}
