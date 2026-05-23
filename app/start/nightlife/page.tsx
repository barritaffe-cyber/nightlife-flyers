"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import Link from "next/link";
import { Smartphone, Sparkles, Square } from "lucide-react";
import { sendClientEventBeacon } from "../../../lib/analytics/client";
import NightlifePreloader from "../../../components/ui/NightlifePreloader";

const FORMAT_CHOICES = [
  { format: "square", label: "Post", cta: "Start Post", Icon: Square },
  { format: "story", label: "Story", cta: "Start Story", Icon: Smartphone },
] as const;

const FEATURED_TEMPLATE = {
  id: "sugar_rush",
  label: "Birthday Bash Flyer",
  eyebrow: "Post-ready club flyer",
  description: "A bright club flyer for birthdays, party hosts, DJs, and weekend events.",
  samples: ["/samples/optimized/sugar-rush.webp", "/samples/optimized/sugar-rush2.webp"],
  format: "square",
};

const TEMPLATE_CARDS = [
  {
    id: "blk_tie",
    label: "Black Tie Flyer",
    description: "Formal luxury flyer with polished gold accents and updated post/story layouts.",
    preview: "/samples/optimized/black-tie.webp",
    format: "square",
  },
  {
    id: "luxe",
    label: "VIP Lounge Flyer",
    description: "Magenta lounge portrait with polished VIP event copy.",
    preview: "/samples/optimized/vip-lounge.webp",
    format: "square",
  },
  {
    id: "edm_stage_co2",
    label: "Techno / Afterhours Flyer",
    description: "Dark system flyer for underground, cyber, and late-night events.",
    preview: "/samples/optimized/techno.webp",
    format: "square",
  },
  {
    id: "afrobeat_rooftop",
    label: "Afrobeat Rooftop Flyer",
    description: "Sunset Afrobeat flyer with updated square/story layouts and social details.",
    preview: "/samples/optimized/afro.webp",
    format: "square",
  },
  {
    id: "square_center_hero_nightlife",
    label: "DJ Night Flyer",
    description: "Cinematic portrait layout for upscale nightlife and guest DJs.",
    preview: "/samples/optimized/dj-night.webp",
    format: "square",
  },
  {
    id: "ladies_night_center_hero",
    label: "Ladies Night Flyer",
    description: "Fashion-forward neon nightlife flyer with matching square and story layouts.",
    preview: "/samples/optimized/nocturne.webp",
    format: "square",
  },
  {
    id: "kpop_pastel_led",
    label: "Cocktail Night Flyer",
    description: "Fresh mojito-style flyer for lounges, bars, happy hour, and drink specials.",
    preview: "/samples/optimized/mojito.webp",
    format: "square",
  },
  {
    id: "fantasy",
    label: "Fantasy Flyer",
    description: "Dream-glow event flyer with surreal color, soft neon, and polished post/story layouts.",
    preview: "/samples/optimized/fantasy.webp",
    format: "square",
  },
  {
    id: "new-york",
    label: "New York Flyer",
    description: "Midnight city energy with bold nightlife copy and a rendered post layout.",
    preview: "/samples/optimized/new-york.webp",
    format: "square",
  },
] as const;

type StarterTemplateCard = (typeof TEMPLATE_CARDS)[number];

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

function DeferredTemplateCard({
  template,
  querySuffix,
  onEditorLinkClick,
}: {
  template: StarterTemplateCard;
  querySuffix: string;
  onEditorLinkClick: (
    event: React.MouseEvent<HTMLAnchorElement>,
    templateId: string,
    label: string,
    format: string
  ) => void;
}) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (visible) return;
    const node = ref.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "420px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <article
      ref={ref}
      className="group min-h-[330px] overflow-hidden border border-white/10 bg-white/[0.035] transition hover:border-cyan-200/40 hover:bg-white/[0.06]"
    >
      {visible ? (
        <>
          <div className="relative aspect-[1.02] overflow-hidden bg-black">
            <img
              src={template.preview}
              alt={`${template.label} rendered flyer preview`}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              width={720}
              height={720}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 767px) 50vw, 33vw"
              draggable={false}
            />
            <div className="absolute left-2 top-2 border border-cyan-100/30 bg-black/55 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-100 backdrop-blur">
              Post + Story
            </div>
          </div>
          <div className="min-h-[146px] p-3">
            <div className="text-sm font-black leading-tight text-white">{template.label}</div>
            <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-white/58">
              {template.description}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {FORMAT_CHOICES.map(({ format: formatChoice, label, Icon }) => (
                <Link
                  key={`${template.id}-${formatChoice}`}
                  href={buildEditorHref(template.id, formatChoice, querySuffix)}
                  onClick={(event) =>
                    onEditorLinkClick(event, template.id, template.label, formatChoice)
                  }
                  className={`inline-flex min-h-9 items-center justify-center gap-1.5 px-2 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                    formatChoice === "square"
                      ? "bg-cyan-200 text-black hover:bg-white"
                      : "border border-white/15 bg-white/[0.04] text-white hover:border-cyan-100/40 hover:bg-white/[0.08]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="aspect-[1.02] bg-white/[0.04]" />
          <div className="min-h-[146px] p-3">
            <div className="h-4 w-2/3 bg-white/[0.06]" />
            <div className="mt-3 h-3 w-full bg-white/[0.045]" />
            <div className="mt-2 h-3 w-4/5 bg-white/[0.045]" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="h-9 bg-white/[0.05]" />
              <div className="h-9 bg-white/[0.05]" />
            </div>
          </div>
        </>
      )}
    </article>
  );
}

export default function NightlifeStarterPage() {
  const [querySuffix, setQuerySuffix] = React.useState("");
  const [featuredSampleIndex, setFeaturedSampleIndex] = React.useState(0);
  const [featuredHeroReady, setFeaturedHeroReady] = React.useState(false);
  const [starterPreloading, setStarterPreloading] = React.useState(true);
  const [starterMinimumElapsed, setStarterMinimumElapsed] = React.useState(false);
  const [openingEditor, setOpeningEditor] = React.useState<{
    label: string;
    format: string;
  } | null>(null);

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

  const finishStarterPreload = React.useCallback(() => {
    setStarterPreloading(false);
    try {
      window.sessionStorage.setItem("nf:nightlifeStarterPreloaderSeen", "1");
    } catch {}
  }, []);

  React.useEffect(() => {
    try {
      if (window.sessionStorage.getItem("nf:nightlifeStarterPreloaderSeen")) {
        setStarterPreloading(false);
        return;
      }
    } catch {}

    const minTimer = window.setTimeout(() => setStarterMinimumElapsed(true), 700);
    const fallbackTimer = window.setTimeout(finishStarterPreload, 2400);
    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, [finishStarterPreload]);

  React.useEffect(() => {
    if (featuredHeroReady && starterMinimumElapsed) {
      finishStarterPreload();
    }
  }, [featuredHeroReady, finishStarterPreload, starterMinimumElapsed]);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setFeaturedSampleIndex((index) => (index + 1) % FEATURED_TEMPLATE.samples.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const clearOpeningState = () => setOpeningEditor(null);
    window.addEventListener("pageshow", clearOpeningState);
    return () => window.removeEventListener("pageshow", clearOpeningState);
  }, []);

  const trackTemplateClick = React.useCallback((templateId: string, label: string, format: string, featured = false) => {
    sendClientEventBeacon("nightlife_starter_template_tapped", {
      properties: {
        source: "nightlife_starter_page",
        template_id: templateId,
        template_label: label,
        template_format: format,
        featured,
      },
    });
  }, []);

  const handleEditorLinkClick = React.useCallback(
    (
      event: React.MouseEvent<HTMLAnchorElement>,
      templateId: string,
      label: string,
      format: string,
      featured = false
    ) => {
      trackTemplateClick(templateId, label, format, featured);

      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      setOpeningEditor({
        label,
        format: format === "story" ? "story" : "post",
      });
    },
    [trackTemplateClick]
  );

  const featuredPostHref = buildEditorHref(FEATURED_TEMPLATE.id, "square", querySuffix);
  const featuredStoryHref = buildEditorHref(FEATURED_TEMPLATE.id, "story", querySuffix);

  return (
    <main className="min-h-screen bg-[#070709] text-white">
      {starterPreloading ? (
        <NightlifePreloader
          surface="overlay"
          title="Loading flyer templates"
          subtitle="Pulling in finished post and story starters."
        />
      ) : null}

      {openingEditor ? (
        <NightlifePreloader
          surface="overlay"
          title="Opening editor"
          subtitle={`Loading ${openingEditor.label} as an editable ${openingEditor.format}.`}
        />
      ) : null}

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
                Nightlife flyer maker
              </div>
              <h1 className="mt-4 max-w-3xl text-[3.2rem] font-black leading-[0.88] tracking-normal text-white sm:text-[4.8rem] lg:text-[6.7rem]">
                Create cinematic nightlife flyers in minutes.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/72 sm:text-lg">
                Pick a finished club flyer, change the text, swap images, adjust the colors, and publish.
              </p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-cyan-100/76">
                Every flyer includes editable post and story formats. Color palettes make it easy to try fast variations without rebuilding the design.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={featuredPostHref}
                  onClick={(event) =>
                    handleEditorLinkClick(event, FEATURED_TEMPLATE.id, FEATURED_TEMPLATE.label, "square", true)
                  }
                  className="inline-flex min-h-14 items-center justify-center gap-2 bg-cyan-300 px-5 text-sm font-black uppercase tracking-[0.12em] text-black shadow-[0_0_42px_rgba(49,194,246,0.34)] transition hover:bg-white"
                >
                  <Square className="h-4 w-4" />
                  Start Post
                </Link>
                <Link
                  href={featuredStoryHref}
                  onClick={(event) =>
                    handleEditorLinkClick(event, FEATURED_TEMPLATE.id, FEATURED_TEMPLATE.label, "story", true)
                  }
                  className="inline-flex min-h-14 items-center justify-center gap-2 border border-cyan-200/35 bg-cyan-200/[0.07] px-5 text-sm font-black uppercase tracking-[0.12em] text-cyan-50 transition hover:border-white/45 hover:bg-white/[0.1]"
                >
                  <Smartphone className="h-4 w-4" />
                  Start Story
                </Link>
                <a
                  href="#templates"
                  className="inline-flex min-h-14 items-center justify-center border border-white/15 bg-white/[0.04] px-5 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:border-white/30 hover:bg-white/[0.08]"
                >
                  Pick another vibe
                </a>
              </div>

              <div className="mt-6 grid max-w-xl grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase tracking-[0.13em] text-white/58">
                <div className="border border-white/10 bg-white/[0.035] px-2 py-3">
                  Post + Story
                </div>
                <div className="border border-white/10 bg-white/[0.035] px-2 py-3">
                  Fast Color Swaps
                </div>
                <div className="border border-white/10 bg-white/[0.035] px-2 py-3">
                  Export Ready
                </div>
              </div>
            </div>

            <article
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
                      width={720}
                      height={720}
                      loading="eager"
                      fetchPriority={index === 0 ? "high" : "low"}
                      decoding="async"
                      onLoad={index === 0 ? () => setFeaturedHeroReady(true) : undefined}
                      onError={index === 0 ? () => setFeaturedHeroReady(true) : undefined}
                      draggable={false}
                    />
                  ))}
                </div>
                <div className="absolute left-6 top-6 border border-cyan-200/35 bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100 backdrop-blur">
                  {FEATURED_TEMPLATE.eyebrow}
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
              <div className="flex flex-col gap-4 border-t border-white/10 bg-[#09090d] p-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <div className="text-3xl font-black leading-none">{FEATURED_TEMPLATE.label}</div>
                  <div className="mt-1 max-w-md text-sm leading-5 text-white/68">
                    {FEATURED_TEMPLATE.description}
                  </div>
                </div>
                <div className="grid shrink-0 grid-cols-2 gap-2">
                  {FORMAT_CHOICES.map(({ format: formatChoice, label, Icon }) => (
                    <Link
                      key={`featured-${formatChoice}`}
                      href={buildEditorHref(FEATURED_TEMPLATE.id, formatChoice, querySuffix)}
                      onClick={(event) =>
                        handleEditorLinkClick(
                          event,
                          FEATURED_TEMPLATE.id,
                          FEATURED_TEMPLATE.label,
                          formatChoice,
                          true
                        )
                      }
                      className={`inline-flex min-h-11 items-center justify-center gap-2 px-4 text-[11px] font-black uppercase tracking-[0.14em] transition ${
                        formatChoice === "square"
                          ? "bg-white text-black hover:bg-cyan-200"
                          : "border border-white/18 bg-white/[0.05] text-white hover:border-cyan-200/45 hover:bg-white/[0.09]"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="templates" className="border-t border-white/10 bg-[#030304] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-200/70">
                More starter flyers
              </div>
              <h2 className="mt-1 text-2xl font-black">Pick a finished look, then choose the layout</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {TEMPLATE_CARDS.map((template) => (
              <DeferredTemplateCard
                key={template.id}
                template={template}
                querySuffix={querySuffix}
                onEditorLinkClick={handleEditorLinkClick}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
