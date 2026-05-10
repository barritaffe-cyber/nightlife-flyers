"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const studioPreviewHref = "/?studio=1";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050608] text-white">
      <section className="relative flex min-h-screen flex-col overflow-hidden">
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
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,8,0.93)_0%,rgba(5,6,8,0.74)_44%,rgba(5,6,8,0.32)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,8,0.54)_0%,rgba(5,6,8,0.12)_38%,#050608_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(0,229,255,0.18)_0%,rgba(255,43,214,0.10)_30%,rgba(5,6,8,0)_60%)]" />

        <header className="relative z-20">
          <div className="mx-auto flex w-full max-w-7xl items-center px-4 py-3 sm:px-6">
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
          </div>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 pb-14 pt-8 sm:px-6">
          <div className="max-w-3xl">
            <h1
              className="max-w-3xl text-[3.35rem] font-black leading-[0.9] text-white sm:text-7xl lg:text-8xl"
              style={{
                fontFamily:
                  '"Coolvetica Hv Comp", "Arial Rounded MT Bold", "Segoe UI", sans-serif',
              }}
            >
              Pull up. Make tonight look alive.
            </h1>

            <div className="mt-6 max-w-2xl space-y-4 text-base leading-7 text-white/82 sm:text-lg sm:leading-8">
              <p className="text-xl font-semibold text-cyan-100 sm:text-2xl">
                Pick a vibe and make something loud.
              </p>
              <p>
                This studio was built for promoters, DJs, nightlife brands, and creators who want
                flyers that actually feel alive: glowing text, layered 3D visuals, cinematic energy,
                all straight from your phone or desktop.
              </p>
              <p>No pressure. No design degree. Just jump in and start creating.</p>
              <p className="font-semibold text-white">👇 Open the studio and make your first flyer.</p>
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
