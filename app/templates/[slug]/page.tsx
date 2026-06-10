import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicSiteFooter from "../../../components/ui/PublicSiteFooter";
import {
  NIGHTLIFE_FLYERS_IDENTITY,
  absoluteUrl,
  buildEditorHref,
  getAllTemplateLandingPages,
  getRelatedTemplateLandingPages,
  getTemplateFormatVariantPages,
  getTemplateLandingPage,
} from "../../../lib/seoPages";
import { getPublicSiteUrl } from "../../../lib/publicIdentity";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTemplateLandingPages().map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getTemplateLandingPage(slug);
  if (!page) return {};

  const siteUrl = getPublicSiteUrl();
  const canonical = absoluteUrl(siteUrl, `/templates/${page.slug}`);

  return {
    title: page.title,
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: `${page.title} | Nightlife Flyers`,
      description: page.metaDescription,
      images: [
        {
          url: page.template.preview,
          width: 900,
          height: 900,
          alt: `${page.title} preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} | Nightlife Flyers`,
      description: page.metaDescription,
      images: [page.template.preview],
    },
  };
}

export default async function TemplateLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getTemplateLandingPage(slug);
  if (!page) notFound();

  const siteUrl = getPublicSiteUrl();
  const canonical = absoluteUrl(siteUrl, `/templates/${page.slug}`);
  const relatedTemplates = getRelatedTemplateLandingPages(page, 4);
  const primaryFormat = page.format ?? "square";
  const squareHref = buildEditorHref(page.template.id, "square");
  const storyHref = buildEditorHref(page.template.id, "story");
  const primaryEditorHref = buildEditorHref(page.template.id, primaryFormat);
  const formatVariantPages = getTemplateFormatVariantPages(page.template.id).filter(
    (formatPage) => formatPage.slug !== page.slug
  );
  const parentHref = page.parentSlug ? `/templates/${page.parentSlug}` : null;
  const tags = page.template.tags.filter(Boolean);
  const eyebrow =
    page.format === "story"
      ? "Instagram story flyer template"
      : page.format === "square"
        ? "Square post flyer template"
        : "Editable flyer template";
  const previewFrameClass =
    page.format === "story"
      ? "mx-auto aspect-[9/16] max-w-[360px] overflow-hidden border border-white/10 bg-black shadow-2xl shadow-cyan-950/20"
      : "mx-auto aspect-square max-w-[520px] overflow-hidden border border-white/10 bg-black shadow-2xl shadow-cyan-950/20";
  const formatEditLabel =
    page.format === "story" ? "Edit Story" : page.format === "square" ? "Edit Post" : "Edit Post";

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      url: canonical,
      description: page.metaDescription,
      inLanguage: "en-US",
      isPartOf: {
        "@type": "WebSite",
        name: "Nightlife Flyers",
        url: siteUrl,
      },
      about: {
        "@type": "CreativeWork",
        name: page.title,
        image: absoluteUrl(siteUrl, page.template.preview),
        keywords: page.keywords.join(", "),
        creativeWorkStatus: page.format ? `${page.format} format template` : "editable template",
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
        {
          "@type": "ListItem",
          position: 3,
          name: page.title,
          item: canonical,
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

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_80%_8%,rgba(244,63,94,0.2),transparent_32%),linear-gradient(180deg,#090a10_0%,#050608_90%)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
          <div className="order-2 lg:order-1">
            <Link href="/templates" className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/80 hover:text-cyan-100">
              Templates
            </Link>
            <p className="mt-8 text-xs font-black uppercase tracking-[0.24em] text-fuchsia-200/80">
              {eyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl">
              {page.h1}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
              {page.intro}
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55">{NIGHTLIFE_FLYERS_IDENTITY}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {page.format ? (
                <>
                  <Link
                    href={primaryEditorHref}
                    className="inline-flex min-h-11 items-center justify-center bg-cyan-200 px-5 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:bg-white"
                  >
                    {formatEditLabel}
                  </Link>
                  {parentHref && (
                    <Link
                      href={parentHref}
                      className="inline-flex min-h-11 items-center justify-center border border-white/15 bg-white/[0.04] px-5 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:border-cyan-100/50 hover:bg-white/[0.08]"
                    >
                      Main Template
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href={squareHref}
                    className="inline-flex min-h-11 items-center justify-center bg-cyan-200 px-5 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:bg-white"
                  >
                    Edit Post
                  </Link>
                  <Link
                    href={storyHref}
                    className="inline-flex min-h-11 items-center justify-center border border-white/15 bg-white/[0.04] px-5 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:border-cyan-100/50 hover:bg-white/[0.08]"
                  >
                    Edit Story
                  </Link>
                </>
              )}
            </div>
            {(formatVariantPages.length > 0 || parentHref) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {parentHref && (
                  <Link
                    href={parentHref}
                    className="border border-white/10 bg-white/[0.035] px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white/65 hover:border-cyan-100/40 hover:text-cyan-100"
                  >
                    All Formats
                  </Link>
                )}
                {formatVariantPages.map((formatPage) => (
                  <Link
                    key={formatPage.slug}
                    href={`/templates/${formatPage.slug}`}
                    className="border border-white/10 bg-white/[0.035] px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white/65 hover:border-cyan-100/40 hover:text-cyan-100"
                  >
                    {formatPage.formatLabel}
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="border border-white/10 bg-white/[0.035] px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white/65">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className={previewFrameClass}>
              <Image
                src={page.template.preview}
                alt={`${page.title} preview`}
                className="h-full w-full object-cover"
                width={900}
                height={900}
                loading="eager"
                sizes="(max-width: 1023px) 100vw, 520px"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.88fr_1.12fr]">
        <div>
          <h2 className="text-2xl font-black text-white">Who This Template Is For</h2>
          <p className="mt-4 text-sm leading-6 text-white/62">{page.audience}</p>
          <div className="mt-6 border border-white/10 bg-white/[0.035] p-5">
            <div className="text-sm font-black uppercase tracking-[0.16em] text-cyan-100">What You Can Edit</div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/65">
              <li>Headline, date, time, venue, offer copy, and RSVP details.</li>
              <li>Colors, typography, background position, flares, textures, and graphic elements.</li>
              <li>
                {page.format === "story"
                  ? "Vertical story format for mobile-first nightlife promotion."
                  : page.format === "square"
                    ? "Square post format for feeds, venue grids, and promoter pages."
                    : "Square post and vertical story versions where supported by the template."}
              </li>
              <li>PNG or JPG export for social media promotion.</li>
            </ul>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black text-white">Use This Template For</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {page.useCases.map((useCase) => (
              <div key={useCase} className="border border-white/10 bg-black/30 p-4">
                <div className="text-sm font-black text-cyan-100">{useCase}</div>
                <p className="mt-2 text-xs leading-5 text-white/55">
                  Open the template, replace the details, then export a finished nightlife flyer.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="border border-white/10 bg-white/[0.035] p-6 sm:p-8">
          <h2 className="text-2xl font-black text-white">How to Customize It</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              [
                "1",
                "Open the template",
                page.format === "story"
                  ? "Load the vertical story version directly in the editor."
                  : page.format === "square"
                    ? "Load the square post version directly in the editor."
                    : "Choose the post or story version and load it directly in the editor.",
              ],
              ["2", "Update the event", "Replace the title, date, venue, DJ, offer, social handle, and RSVP copy."],
              ["3", "Export the flyer", "Download a polished PNG or JPG ready for Instagram, TikTok, or event promotion."],
            ].map(([step, title, body]) => (
              <article key={step} className="border border-white/10 bg-black/25 p-4">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-100">Step {step}</div>
                <h3 className="mt-3 text-base font-black text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/58">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">Related Templates</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
              More editable nightlife flyer templates for similar events and audiences.
            </p>
          </div>
          <Link href="/templates" className="hidden text-xs font-black uppercase tracking-[0.16em] text-cyan-200 hover:text-white sm:block">
            All templates
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {relatedTemplates.map((templatePage) => (
            <Link
              key={templatePage.slug}
              href={`/templates/${templatePage.slug}`}
              className="group overflow-hidden border border-white/10 bg-white/[0.03] transition hover:border-cyan-200/50"
            >
              <div className="aspect-square overflow-hidden bg-black">
                <Image
                  src={templatePage.template.preview}
                  alt={`${templatePage.title} preview`}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  width={900}
                  height={900}
                  loading="lazy"
                  sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
                  decoding="async"
                />
              </div>
              <div className="p-4">
                <div className="text-sm font-black text-white">{templatePage.title}</div>
                <div className="mt-1 line-clamp-2 text-xs leading-5 text-white/55">{templatePage.metaDescription}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
