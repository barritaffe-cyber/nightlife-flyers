import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicSiteFooter from "../../../components/ui/PublicSiteFooter";
import {
  CATEGORY_LANDING_PAGES,
  NIGHTLIFE_FLYERS_IDENTITY,
  absoluteUrl,
  buildEditorHref,
  getCategoryLandingPage,
  getTemplateLandingPagesByIds,
} from "../../../lib/seoPages";
import { getPublicSiteUrl } from "../../../lib/publicIdentity";

type PageProps = {
  params: Promise<{ categorySlug: string }>;
};

export const dynamicParams = false;
const socialPreviewPath = "/og.jpg";

export function generateStaticParams() {
  return CATEGORY_LANDING_PAGES.map((page) => ({ categorySlug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const page = getCategoryLandingPage(categorySlug);
  if (!page) return {};

  const siteUrl = getPublicSiteUrl();
  const canonical = absoluteUrl(siteUrl, `/${page.slug}`);

  return {
    title: page.title,
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${page.title} | Nightlife Flyers`,
      description: page.metaDescription,
      images: [{ url: socialPreviewPath, width: 1920, height: 1080, alt: page.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} | Nightlife Flyers`,
      description: page.metaDescription,
      images: [socialPreviewPath],
    },
  };
}

export default async function CategoryLandingPage({ params }: PageProps) {
  const { categorySlug } = await params;
  const page = getCategoryLandingPage(categorySlug);
  if (!page) notFound();

  const siteUrl = getPublicSiteUrl();
  const canonical = absoluteUrl(siteUrl, `/${page.slug}`);
  const templates = getTemplateLandingPagesByIds(page.templateIds);
  const primaryTemplate = templates[0];

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
        "@type": ["SoftwareApplication", "WebApplication"],
        name: "Nightlife Flyers",
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        url: siteUrl,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${page.title} templates`,
      itemListElement: templates.map((templatePage, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: templatePage.title,
        url: absoluteUrl(siteUrl, `/templates/${templatePage.slug}`),
      })),
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
          name: page.title,
          item: canonical,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];

  return (
    <main className="min-h-screen bg-[#050608] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(244,63,94,0.22),transparent_30%),linear-gradient(180deg,#090a10_0%,#050608_88%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div>
            <Link href="/landing" className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/80 hover:text-cyan-100">
              Nightlife Flyers
            </Link>
            <p className="mt-8 text-xs font-black uppercase tracking-[0.24em] text-fuchsia-200/80">
              {page.eyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl">
              {page.h1}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
              {page.intro}
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55">
              {NIGHTLIFE_FLYERS_IDENTITY}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={primaryTemplate ? buildEditorHref(primaryTemplate.template.id, "square") : "/?studio=1"}
                className="inline-flex min-h-11 items-center justify-center bg-cyan-200 px-5 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:bg-white"
              >
                Start Creating
              </Link>
              <Link
                href="/templates"
                className="inline-flex min-h-11 items-center justify-center border border-white/15 bg-white/[0.04] px-5 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:border-cyan-100/50 hover:bg-white/[0.08]"
              >
                View Templates
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {templates.slice(0, 2).map((templatePage) => (
              <Link
                key={templatePage.slug}
                href={`/templates/${templatePage.slug}`}
                className="group overflow-hidden border border-white/10 bg-black/30 transition hover:border-cyan-200/50"
              >
                <div className="aspect-[1.05] overflow-hidden bg-black">
                  <Image
                    src={templatePage.template.preview}
                    alt={`${templatePage.title} preview`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    width={900}
                    height={900}
                    loading="eager"
                    sizes="(max-width: 1023px) 50vw, 420px"
                    decoding="async"
                  />
                </div>
                <div className="p-4">
                  <div className="text-sm font-black text-white">{templatePage.title}</div>
                  <div className="mt-1 text-xs leading-5 text-white/58">{templatePage.template.tags.join(" / ")}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="text-2xl font-black text-white">Built for Real Nightlife Promotion</h2>
          <p className="mt-4 text-sm leading-6 text-white/62">{page.audience}</p>
          <div className="mt-6 grid gap-3">
            {page.bullets.map((bullet) => (
              <div key={bullet} className="border border-white/10 bg-white/[0.035] p-4 text-sm font-semibold text-white/80">
                {bullet}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black text-white">Use Cases</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {page.useCases.map((useCase) => (
              <div key={useCase} className="border border-white/10 bg-black/30 p-4">
                <div className="text-sm font-black text-cyan-100">{useCase}</div>
                <p className="mt-2 text-xs leading-5 text-white/55">
                  Start with a nightlife flyer template, update the event copy, then export a polished post or story.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">Related Templates</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
              Choose a template, edit the text and visuals, then download a square post or story flyer.
            </p>
          </div>
          <Link href="/templates" className="hidden text-xs font-black uppercase tracking-[0.16em] text-cyan-200 hover:text-white sm:block">
            All templates
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((templatePage) => (
            <article key={templatePage.slug} className="overflow-hidden border border-white/10 bg-white/[0.03]">
              <Link href={`/templates/${templatePage.slug}`} className="group block">
                <div className="aspect-square overflow-hidden bg-black">
                  <Image
                    src={templatePage.template.preview}
                    alt={`${templatePage.title} rendered preview`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    width={900}
                    height={900}
                    loading="lazy"
                    sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    decoding="async"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-base font-black text-white">{templatePage.title}</h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/58">{templatePage.metaDescription}</p>
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

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="grid gap-3 md:grid-cols-2">
          {page.faqs.map((faq) => (
            <article key={faq.question} className="border border-white/10 bg-black/30 p-5">
              <h2 className="text-base font-black text-white">{faq.question}</h2>
              <p className="mt-3 text-sm leading-6 text-white/62">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
