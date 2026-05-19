"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { sendClientEventBeacon } from "../../../lib/analytics/client";

const FEATURED_TEMPLATE = {
  id: "sugar_rush",
  label: "Sugar Rush",
  eyebrow: "Featured nightlife starter",
  description: "Neon pop party flyer with loud color, layered effects, and editable club copy.",
  samples: ["/samples/sugar-rush.png", "/samples/sugar-rush2.png"],
  format: "square",
};

const TEMPLATE_CARDS = [
  {
    id: "edm_tunnel",
    label: "EDM Laser",
    description: "Cyber rave layout with laser energy, stacked metadata, and social icons.",
    preview: "/templates/edm_tunnel.jpg",
    format: "story",
  },
  {
    id: "edm_stage_co2",
    label: "NEURAL//CORE",
    description: "Techno night system flyer with modular festival information blocks.",
    preview: "/templates/edm_stage_co2.jpg",
    format: "square",
  },
  {
    id: "square_center_hero_nightlife",
    label: "AURA",
    description: "Subject-first club flyer with a huge title lane and premium depth.",
    preview: "/scene-assets/center-hero/background.jpg",
    format: "square",
  },
  {
    id: "bottle_service",
    label: "Bottle Service",
    description: "Luxury nightlife promo for lounges, VIP events, and upscale nights.",
    preview: "/templates/bottle_service.jpg",
    format: "square",
  },
  {
    id: "disco_mirrorball",
    label: "Mirrorball Bloom",
    description: "Disco-inspired party look with glow, shine, and dance-floor energy.",
    preview: "/templates/disco_mirrorball.jpg",
    format: "square",
  },
  {
    id: "hiphop_graffiti",
    label: "Hip Hop Block Party",
    description: "Street promo styling for DJs, artists, showcases, and release events.",
    preview: "/templates/hiphop_graffiti.jpg",
    format: "square",
  },
] as const;

function buildEditorHref(templateId: string, format: string, querySuffix: string) {
  return `/?studio=1&template=${encodeURIComponent(templateId)}&format=${encodeURIComponent(
    format
  )}&starter=nightlife${querySuffix}`;
}

function querySuffixFromLocation() {
  if (typeof window === "undefined") return "";
  const current = new URL(window.location.href);
  const params = new URLSearchParams();
  current.searchParams.forEach((value, key) => {
    if (["template", "format", "studio", "starter"].includes(key)) return;
    params.set(key, value);
  });
  const text = params.toString();
  return text ? `&${text}` : "";
}

export default function NightlifeStarterPage() {
  const [querySuffix, setQuerySuffix] = React.useState("");
  const [featuredSampleIndex, setFeaturedSampleIndex] = React.useState(0);

  React.useEffect(() => {
    setQuerySuffix(querySuffixFromLocation());
    sendClientEventBeacon("nightlife_starter_seen", {
      properties: {
        source: "nightlife_starter_page",
        primary_template_id: FEATURED_TEMPLATE.id,
        template_count: TEMPLATE_CARDS.length + 1,
      },
    });
  }, []);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setFeaturedSampleIndex((index) => (index + 1) % FEATURED_TEMPLATE.samples.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, []);

  const trackTemplateClick = React.useCallback((templateId: string, label: string, featured = false) => {
    sendClientEventBeacon("nightlife_starter_template_tapped", {
      properties: {
        source: "nightlife_starter_page",
        template_id: templateId,
        template_label: label,
        featured,
      },
    });
  }, []);

  const featuredHref = buildEditorHref(FEATURED_TEMPLATE.id, FEATURED_TEMPLATE.format, querySuffix);

  return (
    <main className="min-h-screen bg-[#070709] text-white">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_48%_12%,rgba(255,43,214,0.25),transparent_34%),radial-gradient(circle_at_78%_24%,rgba(49,194,246,0.18),transparent_36%),linear-gradient(180deg,#0b0711_0%,#070709_64%,#030304_100%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />

        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <Link href="/landing" className="flex items-center gap-3">
              <img
                src="/branding/nf-logo.png"
                alt="Nightlife Flyers"
                className="h-11 w-11 rounded-full ring-1 ring-cyan-200/45 shadow-[0_0_28px_rgba(49,194,246,0.28)]"
              />
              <span className="text-sm font-black tracking-[0.02em]">Nightlife Flyers</span>
            </Link>
            <Link
              href="/landing"
              className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55 transition hover:text-white"
            >
              About
            </Link>
          </header>

          <div className="grid flex-1 items-center gap-8 py-7 lg:grid-cols-[1.08fr_0.92fr] lg:py-10">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 border border-cyan-200/20 bg-cyan-200/[0.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                Pick a flyer first
              </div>
              <h1 className="mt-4 max-w-3xl text-[3.2rem] font-black leading-[0.88] tracking-normal text-white sm:text-[4.8rem] lg:text-[6.7rem]">
                Pick a vibe. Make the flyer. Fill the room.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/72 sm:text-lg">
                Start with a finished club flyer, change the text, swap images, and export in just minutes. Built for DJs, promoters, lounges, birthdays, rave nights, and club events.
              </p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-cyan-100/76">
                Each template includes fast generated color palettes, so users can upgrade the mood
                in one click without rebuilding the design.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={featuredHref}
                  onClick={() => trackTemplateClick(FEATURED_TEMPLATE.id, FEATURED_TEMPLATE.label, true)}
                  className="inline-flex min-h-14 items-center justify-center gap-2 bg-cyan-300 px-5 text-sm font-black uppercase tracking-[0.12em] text-black shadow-[0_0_42px_rgba(49,194,246,0.34)] transition hover:bg-white"
                >
                  Customize Sugar Rush
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#templates"
                  className="inline-flex min-h-14 items-center justify-center border border-white/15 bg-white/[0.04] px-5 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:border-white/30 hover:bg-white/[0.08]"
                >
                  See more styles
                </a>
              </div>

              <div className="mt-6 grid max-w-xl grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase tracking-[0.13em] text-white/58">
                <div className="border border-white/10 bg-white/[0.035] px-2 py-3">Pick</div>
                <div className="border border-white/10 bg-white/[0.035] px-2 py-3">Edit</div>
                <div className="border border-white/10 bg-white/[0.035] px-2 py-3">Export</div>
              </div>
            </div>

            <Link
              href={featuredHref}
              onClick={() => trackTemplateClick(FEATURED_TEMPLATE.id, FEATURED_TEMPLATE.label, true)}
              className="group order-1 block overflow-hidden border border-fuchsia-200/25 bg-black shadow-[0_26px_90px_rgba(0,0,0,0.62)] transition hover:border-cyan-100/55 lg:order-2"
            >
              <div className="relative overflow-hidden bg-black p-2 sm:p-3">
                <div className="relative aspect-square w-full overflow-hidden bg-black transition duration-500 group-hover:scale-[1.01]">
                  {FEATURED_TEMPLATE.samples.map((sample, index) => (
                    <img
                      key={sample}
                      src={sample}
                      alt={`${FEATURED_TEMPLATE.label} color version ${index + 1}`}
                      className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${
                        index === featuredSampleIndex ? "opacity-100" : "opacity-0"
                      }`}
                      loading="eager"
                      draggable={false}
                    />
                  ))}
                </div>
                <div className="absolute left-6 top-6 border border-cyan-200/35 bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100 backdrop-blur">
                  {FEATURED_TEMPLATE.eyebrow}
                </div>
                <div className="absolute bottom-6 left-6 right-6 border border-fuchsia-200/25 bg-black/60 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/86 backdrop-blur">
                  Color palettes generate fast alternate looks
                </div>
                <div className="absolute right-6 top-6 flex gap-1.5">
                  {FEATURED_TEMPLATE.samples.map((sample, index) => (
                    <span
                      key={`${sample}-dot`}
                      className={`h-1.5 w-6 transition ${
                        index === featuredSampleIndex ? "bg-cyan-200" : "bg-white/25"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-end justify-between gap-4 border-t border-white/10 bg-[#09090d] p-4">
                <div className="min-w-0">
                  <div className="text-3xl font-black leading-none">{FEATURED_TEMPLATE.label}</div>
                  <div className="mt-1 max-w-md text-sm leading-5 text-white/68">
                    {FEATURED_TEMPLATE.description}
                  </div>
                </div>
                <div className="hidden shrink-0 items-center gap-2 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-black sm:inline-flex">
                  Start
                  <Zap className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section id="templates" className="border-t border-white/10 bg-[#030304] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-200/70">
                More nightlife starters
              </div>
              <h2 className="mt-1 text-2xl font-black">Choose the closest vibe</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {TEMPLATE_CARDS.map((template) => {
              const href = buildEditorHref(template.id, template.format, querySuffix);
              return (
                <Link
                  key={template.id}
                  href={href}
                  onClick={() => trackTemplateClick(template.id, template.label)}
                  className="group overflow-hidden border border-white/10 bg-white/[0.035] transition hover:border-cyan-200/40 hover:bg-white/[0.06]"
                >
                  <div className="aspect-[1.02] overflow-hidden bg-black">
                    <img
                      src={template.preview}
                      alt={`${template.label} flyer background`}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                      draggable={false}
                    />
                  </div>
                  <div className="min-h-[112px] p-3">
                    <div className="text-sm font-black leading-tight text-white">{template.label}</div>
                    <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-white/58">
                      {template.description}
                    </div>
                    <div className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100/75">
                      Customize
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
