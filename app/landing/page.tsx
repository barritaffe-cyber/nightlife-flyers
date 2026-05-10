"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const studioPreviewHref = "/?studio=1";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050608] text-white">
      <section className="relative isolate flex min-h-screen flex-col overflow-hidden">
        <div className="absolute inset-0 -z-20" aria-hidden="true">
          <video
            className="h-full w-full object-cover object-center opacity-[0.48] brightness-[0.6] saturate-[1.05] blur-[1px]"
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
            className="object-cover object-center opacity-40"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,6,8,0.98)_0%,rgba(5,6,8,0.9)_48%,rgba(5,6,8,0.68)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(5,6,8,0.68)_0%,rgba(5,6,8,0.22)_38%,#050608_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_42%,rgba(0,229,255,0.12)_0%,rgba(255,43,214,0.08)_30%,rgba(5,6,8,0)_60%)]" />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-10 sm:px-8 lg:px-10">
          <div className="max-w-4xl">
            <Link
              href="/landing"
              className="mb-7 inline-flex items-center gap-3 drop-shadow-[0_2px_18px_rgba(0,0,0,0.75)] sm:mb-9"
              aria-label="Nightlife Flyers home"
            >
              <Image
                src="/branding/nf-logo.png"
                alt="Nightlife Flyers"
                width={64}
                height={64}
                className="h-14 w-14 rounded-full ring-1 ring-cyan-100/45 shadow-[0_0_32px_rgba(103,232,249,0.32)] sm:h-16 sm:w-16"
                priority
              />
              <span className="text-sm font-black text-white sm:text-base">
                Nightlife Flyers
              </span>
            </Link>

            <h1
              className="max-w-4xl text-[4.35rem] font-normal leading-[0.92] text-white drop-shadow-[0_4px_28px_rgba(0,0,0,0.86)] sm:text-[5.6rem] lg:text-[9rem]"
              style={{
                fontFamily:
                  '"Nexa-ExtraLight", "Avenir Next", "Segoe UI", ui-rounded, sans-serif',
                textShadow:
                  "0 0 1px rgba(255,255,255,0.9), 0 8px 34px rgba(0,0,0,0.88)",
              }}
            >
              <span className="block">Make tonight</span>
              <span className="block">look alive.</span>
            </h1>

            <div className="mt-6 max-w-2xl space-y-4 text-base leading-7 text-white/82 sm:text-lg sm:leading-8">
              <p className="text-xl font-semibold text-cyan-100 sm:text-2xl">
                Pull up, pick a vibe, and make something loud.
              </p>
              <p>
                This studio was built for promoters, DJs, nightlife brands, and creators who want
                flyers that actually feel alive: glowing text, layered 3D visuals, cinematic energy,
                all straight from your phone or desktop.
              </p>
              <p>No pressure. No design degree. Just jump in and start creating.</p>
              <p className="font-semibold text-white">Open the studio and make your first flyer.</p>
            </div>

            <Link
              href={studioPreviewHref}
              className="mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-7 text-sm font-black tracking-[0.1em] text-black shadow-[0_0_42px_rgba(103,232,249,0.34)] transition hover:bg-white sm:text-base"
            >
              OPEN FLYER STUDIO
              <ArrowRight className="h-4 w-4" />
            </Link>

            <p className="mt-8 max-w-2xl border-l-2 border-cyan-300/70 pl-4 text-sm leading-6 text-white/72">
              <span className="font-bold text-cyan-100">Small note:</span> Nightlife Flyers is still
              growing and evolving. If you run into bugs, have ideas, or want to help shape the
              future of the app, tap the logo inside the studio and send us feedback directly.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
