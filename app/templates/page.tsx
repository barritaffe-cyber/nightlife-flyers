import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import PublicSiteFooter from "../../components/ui/PublicSiteFooter";
import {
  CATEGORY_LANDING_PAGES,
  NIGHTLIFE_FLYERS_IDENTITY,
  absoluteUrl,
  buildEditorHref,
  getAllTemplateLandingPages,
} from "../../lib/seoPages";
import { getPublicSiteUrl } from "../../lib/publicIdentity";

export const metadata: Metadata = {
  title: "Nightlife Flyer Templates",
  description:
    "Browse editable nightlife flyer templates for club events, DJ flyers, ladies night flyers, Afrobeats flyers, bottle service flyers, lounge flyers, and party flyers.",
  keywords: [
    "nightlife flyer templates",
    "club flyer templates",
    "DJ flyer templates",
    "party flyer templates",
    "event flyer templates",
    "AI flyer maker",
  ],
  alternates: {
    canonical: "/templates",
  },
};

export default function TemplatesIndexPage() {
  const siteUrl = getPublicSiteUrl();
  const templates = getAllTemplateLandingPages();
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Nightlife Flyer Templates",
      url: absoluteUrl(siteUrl, "/templates"),
      description: metadata.description,
      isPartOf: {
        "@type": "WebSite",
        name: "Nightlife Flyers",
        url: siteUrl,
      },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: templates.map((templatePage, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: templatePage.title,
          url: absoluteUrl(siteUrl, `/templates/${templatePage.slug}`),
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Nightlife Flyers",
          item: siteUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Templates",
          item: absoluteUrl(siteUrl, "/templates"),
        },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-[#050608] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.2),transparent_32%),linear-gradient(180deg,#090a10_0%,#050608_90%)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <Link href="/landing" className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/80 hover:text-cyan-100">
            Nightlife Flyers
          </Link>
          <p className="mt-8 text-xs font-black uppercase tracking-[0.24em] text-fuchsia-200/80">
            Templates
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl">
            Nightlife Flyer Templates for Clubs, DJs, Lounges, Bars, and Events
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-white/72 sm:text-lg">
            Browse editable flyer templates built for nightlife promotion. Each template can be opened in the studio, customized, and exported as a square post or vertical story.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/55">{NIGHTLIFE_FLYERS_IDENTITY}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/?studio=1"
              className="inline-flex min-h-11 items-center justify-center bg-cyan-200 px-5 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:bg-white"
            >
              Start Creating
            </Link>
            <Link
              href="/pricing"
              className="inline-flex min-h-11 items-center justify-center border border-white/15 bg-white/[0.04] px-5 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:border-cyan-100/50 hover:bg-white/[0.08]"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-5 flex flex-wrap gap-2">
          {CATEGORY_LANDING_PAGES.map((category) => (
            <Link
              key={category.slug}
              href={`/${category.slug}`}
              className="border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-black uppercase tracking-[0.13em] text-white/70 hover:border-cyan-100/40 hover:text-cyan-100"
            >
              {category.title}
            </Link>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((templatePage) => (
            <article key={templatePage.slug} className="overflow-hidden border border-white/10 bg-white/[0.03]">
              <Link href={`/templates/${templatePage.slug}`} className="group block">
                <div className="aspect-square overflow-hidden bg-black">
                  <Image
                    src={templatePage.template.preview}
                    alt={`${templatePage.title} rendered flyer preview`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    width={900}
                    height={900}
                    loading="lazy"
                    sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    decoding="async"
                  />
                </div>
                <div className="min-h-[148px] p-4">
                  <div className="text-base font-black text-white">{templatePage.title}</div>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/58">{templatePage.metaDescription}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {templatePage.template.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="bg-white/[0.06] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/55">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
              <div className="grid grid-cols-2 border-t border-white/10">
                <Link href={buildEditorHref(templatePage.template.id, "square")} className="px-3 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-cyan-100 hover:bg-white/[0.06]">
                  Post
                </Link>
                <Link href={buildEditorHref(templatePage.template.id, "story")} className="border-l border-white/10 px-3 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-fuchsia-100 hover:bg-white/[0.06]">
                  Story
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
